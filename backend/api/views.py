import json
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Sum
import random
from .models import (
    Profesor, Sesion, Alumno, Equipo, 
    EquipoAlumno, Token, EventoPuntaje
)


def obtener_o_crear_profesor_default():
    """Obtiene o crea un profesor por defecto para sesiones sin profesor asignado"""
    profesor, _ = Profesor.objects.get_or_create(
        email='default@udd.cl',
        defaults={'nombre': 'Profesor Default'}
    )
    return profesor


    

# 1. Crear una sesión real cuando el Profe entra a la pantalla
@csrf_exempt
def crear_sesion_profesor(request):
    """Crea una sesión de profesor con metadatos administrativos.

    Mantiene compatibilidad con el flujo antiguo: si no llega body JSON,
    crea una sesión con datos por defecto. Los datos nuevos se guardan en
    config_tiempos para evitar migraciones obligatorias y no romper sesiones
    existentes.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        raw_body = request.body.decode('utf-8', errors='ignore').strip()
        data = json.loads(raw_body) if raw_body else {}

        nombre_profesor = str(data.get('nombreProfesor') or data.get('nombre_profesor') or 'Profesor Principal').strip()
        facultad = str(data.get('facultad') or 'Sin facultad registrada').strip()
        modalidad = str(data.get('modalidadGrupos') or data.get('modalidad_grupos') or 'manual').strip().lower()
        if modalidad not in ['manual', 'excel']:
            modalidad = 'manual'

        grupos = data.get('grupos') if isinstance(data.get('grupos'), list) else []

        # Email técnico determinístico por nombre; evita pedir email real.
        email_base = ''.join(ch.lower() if ch.isalnum() else '.' for ch in nombre_profesor).strip('.') or 'profesor'
        email = f'{email_base}@misionemprende.local'
        profe, _ = Profesor.objects.get_or_create(email=email, defaults={'nombre': nombre_profesor})
        if profe.nombre != nombre_profesor:
            profe.nombre = nombre_profesor
            profe.save(update_fields=['nombre'])

        metadata = {
            'nombreProfesor': nombre_profesor,
            'facultad': facultad,
            'modalidadGrupos': modalidad,
            'origenGrupos': modalidad,
            'gruposExcel': grupos if modalidad == 'excel' else [],
        }

        with transaction.atomic():
            nueva_sesion = Sesion.objects.create(
                profesor=profe,
                estado='EN_ESPERA',
                config_tiempos=metadata,
            )

            # Si el profesor eligió Excel, dejamos los grupos creados como
            # equipos reales de la sesión para que aparezcan en el panel.
            if modalidad == 'excel':
                for idx, grupo in enumerate(grupos, start=1):
                    nombre_grupo = str(grupo.get('nombreGrupo') or grupo.get('nombre') or f'Grupo {idx}').strip()
                    integrantes = grupo.get('integrantes') or []
                    if not nombre_grupo or not integrantes:
                        continue
                    equipo = Equipo.objects.create(sesion=nueva_sesion, nombre=nombre_grupo)
                    for integrante in integrantes:
                        if isinstance(integrante, dict):
                            nombre_alumno = str(integrante.get('nombre') or integrante.get('name') or '').strip()
                            carrera = str(integrante.get('carrera') or 'Sin definir').strip()
                        else:
                            nombre_alumno = str(integrante).strip()
                            carrera = 'Sin definir'
                        if not nombre_alumno:
                            continue
                        alumno, _ = Alumno.objects.get_or_create(
                            nombre=nombre_alumno,
                            defaults={'carrera': carrera or 'Sin definir', 'email': None}
                        )
                        if not EquipoAlumno.objects.filter(sesion=nueva_sesion, alumno=alumno).exists():
                            EquipoAlumno.objects.create(equipo=equipo, sesion=nueva_sesion, alumno=alumno)

        return JsonResponse({
            'status': 'ok',
            'codigo': nueva_sesion.codigo_acceso,
            'sesion': {
                'codigo': nueva_sesion.codigo_acceso,
                'nombreProfesor': nombre_profesor,
                'facultad': facultad,
                'modalidadGrupos': modalidad,
                'grupos_creados': len(grupos) if modalidad == 'excel' else 0,
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

# 2. Listar equipos conectados a una sesión específica (Polling)
def obtener_equipos_sesion(request, codigo):
    try:
        # Buscamos la sesión por su código
        sesion = Sesion.objects.get(codigo_acceso=codigo)
        
        # Obtenemos los equipos asociados
        equipos = Equipo.objects.filter(sesion=sesion).values('id', 'nombre')
        
        return JsonResponse({
            'status': 'ok', 
            'equipos': list(equipos)
        })
    except Sesion.DoesNotExist:
        return JsonResponse({'error': 'Sesión no encontrada'}, status=404)

def obtener_o_crear_sesion(codigo_acceso):
    """Obtiene una sesión existente o crea una nueva con el código dado"""
    try:
        sesion = Sesion.objects.get(codigo_acceso=codigo_acceso)
    except Sesion.DoesNotExist:
        # Crear nueva sesión si no existe
        profesor = obtener_o_crear_profesor_default()
        sesion = Sesion.objects.create(
            profesor=profesor,
            codigo_acceso=codigo_acceso,
            estado='EN_ESPERA'
        )
    return sesion


@csrf_exempt
def registrar_equipo(request):
    """
    Registra un equipo y sus integrantes en una sesión.
    
    Espera un JSON con:
    {
        "nombre_equipo": "Nombre del equipo",
        "codigo": "Código de sesión (6 caracteres)",
        "carrera_principal": "Carrera principal del equipo",
        "integrantes": [
            {"nombre": "Juan Pérez", "carrera": "Ingeniería"},
            {"nombre": "María García", "carrera": "Diseño"}
        ]
    }
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        # Soportar body JSON vacío/mal formado y payloads con nombres legacy.
        raw_body = request.body.decode("utf-8", errors="ignore").strip()
        data = json.loads(raw_body) if raw_body else {}

        def _first_non_blank(*values, default=""):
            for value in values:
                if value is None:
                    continue
                normalized = str(value).strip()
                if normalized:
                    return normalized
            return default

        codigo_sesion = _first_non_blank(
            data.get("codigo"),
            data.get("codigo_sesion"),
            data.get("codigo_acceso"),
            data.get("sessionCode"),
        ).upper()

        nombre_equipo = _first_non_blank(
            data.get("nombre_equipo"),
            data.get("nombreEquipo"),
            data.get("equipo"),
            data.get("teamName"),
        )

        carrera_principal = _first_non_blank(
            data.get("carrera_principal"),
            data.get("carreraPrincipal"),
            data.get("career"),
            default="Sin definir",
        )

        lista_integrantes = (
            data.get("integrantes")
            or data.get("miembros")
            or data.get("alumnos")
            or data.get("members")
            or []
        )
        if not isinstance(lista_integrantes, list):
            return JsonResponse({"error": "El campo de integrantes debe ser una lista"}, status=400)
        
        # Debug: imprimir datos recibidos
        print(f"DEBUG - Datos recibidos: {data}")
        print(f"DEBUG - Código: {codigo_sesion}, Equipo: {nombre_equipo}, Integrantes: {len(lista_integrantes)}")
        
        # Validaciones básicas
        if not codigo_sesion:
            return JsonResponse({"error": "El código de sesión es requerido"}, status=400)
        
        if not nombre_equipo:
            return JsonResponse({"error": "El nombre del equipo es requerido"}, status=400)
        
        if not lista_integrantes or len(lista_integrantes) == 0:
            return JsonResponse({"error": "Debe haber al menos un integrante"}, status=400)
        
        # Usar transacción para asegurar consistencia
        with transaction.atomic():
            # 1. Obtener o crear la sesión
            sesion = obtener_o_crear_sesion(codigo_sesion)
            
            # 2. Verificar que no exista un equipo con el mismo nombre en esta sesión
            if Equipo.objects.filter(sesion=sesion, nombre=nombre_equipo).exists():
                return JsonResponse({
                    "error": f"Ya existe un equipo llamado '{nombre_equipo}' en esta sesión"
                }, status=400)
            
            # 3. Crear el equipo
            nuevo_equipo = Equipo.objects.create(nombre=nombre_equipo, sesion=sesion)
            # 4. Procesar integrantes
            alumnos_creados = []
            for integrante in lista_integrantes:
                nombre_alumno = _first_non_blank(
                    integrante.get("nombre")
                    , integrante.get("name")
                    , integrante.get("alumno")
                )
                carrera_alumno = _first_non_blank(
                    integrante.get("carrera"),
                    integrante.get("career"),
                    carrera_principal,
                    default="Sin definir",
                )
                
                if not nombre_alumno:
                    continue  # Saltar si no hay nombre
                
                # Buscar o crear el alumno
                # Nota: Si el email no se proporciona, creamos sin email (puede ser null)
                alumno, creado = Alumno.objects.get_or_create(
                    nombre=nombre_alumno,
                    defaults={
                        'carrera': carrera_alumno or 'Sin definir',
                        'email': None  # Se puede agregar después
                    }
                )
                
                # Si el alumno ya existía pero no tenía carrera, actualizarla
                if not creado and not alumno.carrera:
                    alumno.carrera = carrera_alumno or 'Sin definir'
                    alumno.save()
                
                # Crear la relación EquipoAlumno
                # Verificar que el alumno no esté ya en otro equipo de esta sesión
                if EquipoAlumno.objects.filter(sesion=sesion, alumno=alumno).exists():
                    # Si ya está en otro equipo, no lo agregamos (o puedes decidir otra lógica)
                    continue
                
                EquipoAlumno.objects.create(
                    equipo=nuevo_equipo,
                    sesion=sesion,
                    alumno=alumno
                )
                
                alumnos_creados.append({
                    'nombre': alumno.nombre,
                    'carrera': alumno.carrera
                })
            
            # 5. Si no se creó ningún alumno, eliminar el equipo
            if not alumnos_creados:
                nuevo_equipo.delete()
                return JsonResponse({
                    "error": "No se pudo crear ningún integrante válido"
                }, status=400)
        
        return JsonResponse({
            "status": "ok",
            "id": nuevo_equipo.id,
            "equipo_id": nuevo_equipo.id,
            "equipo": nombre_equipo,
            "sesion": codigo_sesion,
            "integrantes_creados": len(alumnos_creados),
            "integrantes": alumnos_creados
        })
    
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except Exception as e:
        print(f"ERROR al registrar equipo: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": f"Error interno: {str(e)}"}, status=500)

@csrf_exempt
def obtener_equipos_sesion(request, codigo=None, codigo_sesion=None):
    """Obtiene todos los equipos de una sesión"""
    try:
        # Usamos la variable 'codigo' que acabamos de recibir
        codigo = (codigo or codigo_sesion or '').upper()
        sesion = Sesion.objects.get(codigo_acceso=codigo) 
        
        equipos = Equipo.objects.filter(sesion=sesion).select_related('sesion')
        
        equipos_data = []
        for equipo in equipos:
            integrantes = EquipoAlumno.objects.filter(
                equipo=equipo, 
                sesion=sesion
            ).select_related('alumno')
            
            equipos_data.append({
                'id': equipo.id,
                'nombre': equipo.nombre,
                'puntaje_total': equipo.puntaje_total,
                'integrantes': [
                    {
                        'nombre': ea.alumno.nombre,
                        'carrera': ea.alumno.carrera
                    }
                    for ea in integrantes
                ],
                'miembros': [
                    {
                        'nombre': ea.alumno.nombre,
                        'carrera': ea.alumno.carrera
                    }
                    for ea in integrantes
                ]
            })
        
        return JsonResponse({
            'status': 'ok',
            'sesion': codigo, # <--- También aquí usamos 'codigo'
            'equipos': equipos_data
        })
    
    except Sesion.DoesNotExist:
        return JsonResponse({"error": "Sesión no encontrada"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
        
# --- VISTA PARA EL DASHBOARD DE ADMIN ---
def _session_metadata(sesion):
    """Normaliza metadatos nuevos y sesiones antiguas."""
    cfg = sesion.config_tiempos or {}
    if not isinstance(cfg, dict):
        cfg = {}
    nombre_profesor = cfg.get('nombreProfesor') or getattr(sesion.profesor, 'nombre', None) or 'Sin profesor registrado'
    facultad = cfg.get('facultad') or 'Sin facultad registrada'
    modalidad = cfg.get('modalidadGrupos') or cfg.get('modalidad_grupos') or 'No especificada'
    return {
        'nombreProfesor': nombre_profesor,
        'facultad': facultad,
        'modalidadGrupos': modalidad,
        'origenGrupos': cfg.get('origenGrupos') or modalidad,
    }


def _format_duration(fecha_inicio, fecha_fin):
    if not fecha_inicio or not fecha_fin:
        return None
    seconds = int((fecha_fin - fecha_inicio).total_seconds())
    if seconds < 0:
        return None
    minutes = seconds // 60
    return f'{minutes} min' if minutes < 120 else f'{minutes // 60} h {minutes % 60} min'


@csrf_exempt
def obtener_admin_stats(request):
    try:
        sesiones = Sesion.objects.all().select_related('profesor').prefetch_related('equipos__miembros__alumno').order_by('-creado_en')
        equipos = Equipo.objects.all().select_related('sesion').prefetch_related('miembros__alumno')

        lista_equipos = []
        total_participantes = 0
        for equipo in equipos:
            miembros = equipo.miembros.all()
            nombres_miembros = [f"{m.alumno.nombre} ({m.alumno.carrera})" for m in miembros]
            total_participantes += len(nombres_miembros)
            lista_equipos.append({
                'id': equipo.id,
                'nombre': equipo.nombre,
                'codigo_sesion': equipo.sesion.codigo_acceso,
                'puntaje_total': equipo.puntaje_total,
                'miembros': nombres_miembros,
            })

        sesiones_data = []
        facultades = {}
        profesores = {}
        modalidades = {}
        sesiones_por_fecha = {}
        total_grupos = 0
        total_participantes_sesiones = 0
        duraciones_seg = []

        for sesion in sesiones:
            meta = _session_metadata(sesion)
            equipos_sesion = list(sesion.equipos.all())
            grupos_count = len(equipos_sesion)
            participantes_count = sum(e.miembros.count() for e in equipos_sesion)
            total_grupos += grupos_count
            total_participantes_sesiones += participantes_count
            fecha_ref = sesion.fecha_inicio or sesion.creado_en
            fecha_key = fecha_ref.date().isoformat() if fecha_ref else 'Sin fecha'
            sesiones_por_fecha[fecha_key] = sesiones_por_fecha.get(fecha_key, 0) + 1
            facultades[meta['facultad']] = facultades.get(meta['facultad'], 0) + 1
            profesores[meta['nombreProfesor']] = profesores.get(meta['nombreProfesor'], 0) + 1
            modalidades[meta['modalidadGrupos']] = modalidades.get(meta['modalidadGrupos'], 0) + 1

            if sesion.fecha_inicio and sesion.fecha_fin:
                seconds = int((sesion.fecha_fin - sesion.fecha_inicio).total_seconds())
                if seconds >= 0:
                    duraciones_seg.append(seconds)

            sesiones_data.append({
                'id': sesion.id,
                'codigo': sesion.codigo_acceso,
                'estado': sesion.estado,
                'fase_actual': sesion.fase_actual,
                'fecha_inicio': sesion.fecha_inicio.isoformat() if sesion.fecha_inicio else None,
                'fecha_fin': sesion.fecha_fin.isoformat() if sesion.fecha_fin else None,
                'creado_en': sesion.creado_en.isoformat() if sesion.creado_en else None,
                'duracion': _format_duration(sesion.fecha_inicio, sesion.fecha_fin),
                'nombreProfesor': meta['nombreProfesor'],
                'facultad': meta['facultad'],
                'modalidadGrupos': meta['modalidadGrupos'],
                'cantidad_grupos': grupos_count,
                'cantidad_participantes': participantes_count,
                'puntaje_total': sum(e.puntaje_total for e in equipos_sesion),
                'grupos': [
                    {
                        'id': e.id,
                        'nombre': e.nombre,
                        'puntaje_total': e.puntaje_total,
                        'integrantes': [
                            {'nombre': m.alumno.nombre, 'carrera': m.alumno.carrera}
                            for m in e.miembros.all()
                        ]
                    }
                    for e in equipos_sesion
                ]
            })

        def top_key(counter, fallback='Sin datos suficientes'):
            if not counter:
                return fallback
            return sorted(counter.items(), key=lambda item: item[1], reverse=True)[0][0]

        promedio_por_grupo = round(total_participantes_sesiones / total_grupos, 1) if total_grupos else 0
        duracion_promedio = None
        if duraciones_seg:
            avg_min = int((sum(duraciones_seg) / len(duraciones_seg)) // 60)
            duracion_promedio = f'{avg_min} min'

        metricas = {
            'total_sesiones': sesiones.count(),
            'total_estudiantes': total_participantes_sesiones,
            'total_grupos': total_grupos,
            'promedio_estudiantes_por_grupo': promedio_por_grupo,
            'facultad_mas_frecuente': top_key(facultades),
            'profesor_con_mas_sesiones': top_key(profesores),
            'modalidad_mas_usada': top_key(modalidades),
            'ultima_sesion': sesiones_data[0]['creado_en'] if sesiones_data else None,
            'duracion_promedio': duracion_promedio or 'Sin datos suficientes',
            'participacion_por_facultad': facultades,
            'sesiones_por_fecha': sesiones_por_fecha,
            'sesiones_por_profesor': profesores,
            'sesiones_por_modalidad': modalidades,
        }

        return JsonResponse({
            'status': 'ok',
            'total_equipos': equipos.count(),
            'total_agentes': total_participantes,
            'equipos': lista_equipos,
            'metricas': metricas,
            'sesiones': sesiones_data,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)

def calcular_puntaje_actual(equipo):
   
    resultado = EventoPuntaje.objects.filter(equipo=equipo).aggregate(total=Sum('valor'))
    return resultado['total'] or 0

@csrf_exempt
def agregar_tokens(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        data = json.loads(request.body)
        equipo = Equipo.objects.get(id=data.get("equipo_id"))
        sesion = Sesion.objects.get(id=data.get("sesion_id"))
        
        # 1. EVENT SOURCING (Append-Only)
        # Guardamos el hecho que ocurrió. Nunca mutamos el estado de 'equipo'.
        EventoPuntaje.objects.create(
            equipo=equipo,
            sesion=sesion,
            tipo=data.get("origen", "BONO_ADMIN"),
            valor=data.get("valor", 0),
            detalles={"descripcion": data.get("descripcion", "")}
        )
        
        # 2. LECTURA DEL ESTADO
        # Rehidratamos el puntaje actual leyendo la historia
        nuevo_puntaje = calcular_puntaje_actual(equipo)
        
        return JsonResponse({
            "status": "ok",
            "nuevo_puntaje": nuevo_puntaje
        })
        
    except Equipo.DoesNotExist:
        return JsonResponse({"error": "Equipo no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def validar_sesion(request):
    """Verifica si un código de sesión existe en la base de datos"""
    if request.method == "GET":
        codigo = request.GET.get('codigo', '').strip().upper()
        
        # Verificamos si la sesión existe
        existe = Sesion.objects.filter(codigo_acceso=codigo).exists()
        
        if existe:
            return JsonResponse({'status': 'ok'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Sesión no encontrada'})
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

# --- RUTAS DEL MOTOR DE SINCRONIZACIÓN (MULTIJUGADOR) ---

@csrf_exempt
def obtener_estado_juego(request):
    """El 'latido' que el frontend consulta cada 3 segundos"""
    codigo = request.GET.get('codigo', '').strip().upper()
    nombre_equipo = request.GET.get('equipo', '').strip()

    try:
        sesion = Sesion.objects.get(codigo_acceso=codigo)
        equipo = Equipo.objects.get(sesion=sesion, nombre=nombre_equipo)
        
        equipo.save(update_fields=['ultima_conexion'])
        ranking = list(Equipo.objects.filter(sesion=sesion).order_by('-puntaje_total').values('nombre', 'puntaje_total'))[:5]

        # Verificar si todos terminaron en Fase 4
        all_presented = False
        if sesion.fase_actual == 4 and sesion.sub_fase == 'pitches':
            total_equipos = sesion.equipos.count()
            presentaron = sesion.equipos.filter(ya_presento_pitch=True).count()
            all_presented = (total_equipos > 0 and total_equipos == presentaron)

        return JsonResponse({
            "status": "ok",
            "current_stage": sesion.fase_actual,
            "paused": sesion.esta_pausada,
            "equipo_termino_fase": equipo.termino_fase_actual,
            "ranking_temporal": ranking,
            "sub_stage": sesion.sub_fase,
            "roulette_winner": sesion.ganador_ruleta,
            "current_presenter": sesion.equipo_presentando,
            "all_presented": all_presented
        })
    except (Sesion.DoesNotExist, Equipo.DoesNotExist):
        return JsonResponse({"status": "kicked"})

@csrf_exempt
def equipo_termina_fase(request):
    """Llamado por el equipo cuando terminan una fase antes de tiempo"""
    if request.method == 'POST':
        data = json.loads(request.body)
        codigo = data.get('codigo', '').strip().upper()
        nombre_equipo = data.get('equipo', '').strip()
        
        try:
            sesion = Sesion.objects.get(codigo_acceso=codigo)
            # Marcamos al equipo como listo
            Equipo.objects.filter(sesion=sesion, nombre=nombre_equipo).update(termino_fase_actual=True)
            
            # --- MAGIA AUTOMÁTICA ---
            # Si todos los equipos de la sesión ya terminaron, pasamos de fase automáticamente
            total_equipos = Equipo.objects.filter(sesion=sesion).count()
            terminaron = Equipo.objects.filter(sesion=sesion, termino_fase_actual=True).count()
            
            if total_equipos > 0 and total_equipos == terminaron:
                sesion.fase_actual += 1
                if sesion.fase_actual >= 5:
                    sesion.estado = 'FINALIZADA'
                    if not sesion.fecha_fin:
                        sesion.fecha_fin = timezone.now()
                sesion.save()
                # Reseteamos el estado de los equipos para la nueva fase
                Equipo.objects.filter(sesion=sesion).update(termino_fase_actual=False)
                
            return JsonResponse({"status": "ok"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Método no permitido"}, status=405)

# --- RUTAS DE CONTROL DEL PROFESOR ---

@csrf_exempt
def admin_start(request):
    codigo = request.GET.get('codigo', '').strip().upper()
    try:
        sesion = Sesion.objects.get(codigo_acceso=codigo)
        sesion.fase_actual = 1
        sesion.esta_pausada = False
        sesion.estado = 'EN_CURSO'
        if not sesion.fecha_inicio:
            sesion.fecha_inicio = timezone.now()
        sesion.save()
        Equipo.objects.filter(sesion=sesion).update(termino_fase_actual=False)
        return JsonResponse({"status": "ok"})
    except Sesion.DoesNotExist:
        return JsonResponse({"error": "Sesión no existe"}, status=404)

@csrf_exempt
def admin_pause(request):
    codigo = request.GET.get('codigo', '').strip().upper()
    state_str = request.GET.get('state', 'false').lower()
    is_pausing = state_str == 'true'
    
    Sesion.objects.filter(codigo_acceso=codigo).update(esta_pausada=is_pausing)
    return JsonResponse({"status": "ok"})

@csrf_exempt
def admin_next(request):
    codigo = request.GET.get('codigo', '').strip().upper()
    try:
        sesion = Sesion.objects.get(codigo_acceso=codigo)
        sesion.fase_actual += 1
        sesion.esta_pausada = False
        
        # Reset de Fase 4
        if sesion.fase_actual == 4:
            sesion.sub_fase = 'prep'
            sesion.ganador_ruleta = None
            sesion.equipo_presentando = None
            sesion.equipos.all().update(ya_presento_pitch=False)

        if sesion.fase_actual >= 5:
            sesion.estado = 'FINALIZADA'
            if not sesion.fecha_fin:
                sesion.fecha_fin = timezone.now()
                
        sesion.save()
        Equipo.objects.filter(sesion=sesion).update(termino_fase_actual=False)
        return JsonResponse({"status": "ok", "new_stage": sesion.fase_actual})
    except Sesion.DoesNotExist:
        return JsonResponse({"error": "Sesión no existe"}, status=404)

# --- AÑADIR AL FINAL DEL ARCHIVO ---

@csrf_exempt
def equipo_listo(request):
    """Sincroniza subfases ('prep' -> 'coins_intro' -> 'pitches') cuando todos los equipos confirman."""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    data = json.loads(request.body)
    codigo = data.get('codigo', '').strip().upper()
    nombre_equipo = data.get('equipo', '').strip()
    sub_stage = data.get('sub_stage', '').strip()

    try:
        sesion = Sesion.objects.get(codigo_acceso=codigo)
        Equipo.objects.filter(sesion=sesion, nombre=nombre_equipo).update(termino_fase_actual=True)

        total_equipos = sesion.equipos.count()
        listos = sesion.equipos.filter(termino_fase_actual=True).count()

        if total_equipos > 0 and listos == total_equipos:
            if sub_stage == 'prep':
                sesion.sub_fase = 'coins_intro'
            elif sub_stage == 'coins_intro':
                sesion.sub_fase = 'pitches'
                # Sorteo de ruleta inicial
                pendientes = list(sesion.equipos.filter(ya_presento_pitch=False).values_list('nombre', flat=True))
                if pendientes:
                    ganador = random.choice(pendientes)
                    sesion.ganador_ruleta = ganador
                    sesion.equipo_presentando = ganador
            
            sesion.save(update_fields=['sub_fase', 'ganador_ruleta', 'equipo_presentando'])
            sesion.equipos.all().update(termino_fase_actual=False)

        return JsonResponse({"status": "ok"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def terminar_pitch(request):
    """Marca al equipo como expuesto y sortea la ruleta para el siguiente."""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    data = json.loads(request.body)
    codigo = data.get('codigo', '').strip().upper()
    nombre_equipo = data.get('equipo', '').strip()

    try:
        sesion = Sesion.objects.get(codigo_acceso=codigo)
        Equipo.objects.filter(sesion=sesion, nombre=nombre_equipo).update(ya_presento_pitch=True)

        pendientes = list(sesion.equipos.filter(ya_presento_pitch=False).values_list('nombre', flat=True))
        if pendientes:
            ganador = random.choice(pendientes)
            sesion.ganador_ruleta = ganador
            sesion.equipo_presentando = ganador
        else:
            sesion.ganador_ruleta = None
            sesion.equipo_presentando = None

        sesion.save(update_fields=['ganador_ruleta', 'equipo_presentando'])
        return JsonResponse({"status": "ok"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)