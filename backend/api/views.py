import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import (
    Profesor, Sesion, Alumno, Equipo, 
    EquipoAlumno, Token
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
    if request.method == 'POST':
        # Buscamos un profesor por defecto (o creamos uno dummy si no hay login real aun)
        profe, _ = Profesor.objects.get_or_create(nombre="Profesor Principal", email="profe@udd.cl")
        
        # Creamos la sesión nueva
        nueva_sesion = Sesion.objects.create(profesor=profe, estado='EN_ESPERA')
        
        return JsonResponse({
            'status': 'ok', 
            'codigo': nueva_sesion.codigo_acceso
        })
    return JsonResponse({'error': 'Método no permitido'}, status=405)

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
        data = json.loads(request.body)
        codigo_sesion = data.get("codigo", "").strip().upper()
        nombre_equipo = data.get("nombre_equipo", "").strip()
        carrera_principal = data.get("carrera_principal", "").strip()
        lista_integrantes = data.get("integrantes", [])
        
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
            nuevo_equipo = Equipo.objects.create(
                nombre=data["nombre_equipo"],
                sesion=sesion,
            )
            # 4. Procesar integrantes
            alumnos_creados = []
            for integrante in lista_integrantes:
                nombre_alumno = integrante.get("nombre", "").strip()
                carrera_alumno = integrante.get("carrera", carrera_principal).strip()
                
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
def obtener_equipos_sesion(request, codigo): # <--- CAMBIO AQUÍ: de 'codigo_sesion' a 'codigo'
    """Obtiene todos los equipos de una sesión"""
    try:
        # Usamos la variable 'codigo' que acabamos de recibir
        sesion = Sesion.objects.get(codigo_acceso=codigo.upper()) 
        
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
@csrf_exempt
def obtener_admin_stats(request):
    try:
        # 1. Traemos todos los equipos y optimizamos la consulta
        equipos = Equipo.objects.all().select_related('sesion').prefetch_related('miembros__alumno')
        
        lista_equipos = []
        total_agentes = 0
        
        for equipo in equipos:
            # Obtenemos los nombres de los alumnos de este equipo
            miembros = equipo.miembros.all() # Esto accede a la tabla intermedia EquipoAlumno
            nombres_miembros = [f"{m.alumno.nombre} ({m.alumno.carrera})" for m in miembros]
            total_agentes += len(nombres_miembros)
            
            lista_equipos.append({
                'id': equipo.id,
                'nombre': equipo.nombre,
                'codigo_sesion': equipo.sesion.codigo_acceso,
                'miembros': nombres_miembros
            })
            
        return JsonResponse({
            'status': 'ok',
            'total_equipos': equipos.count(),
            'total_agentes': total_agentes,
            'equipos': lista_equipos
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def agregar_tokens(request):
    """Agrega tokens a un equipo"""
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        data = json.loads(request.body)
        equipo_id = data.get("equipo_id")
        sesion_id = data.get("sesion_id")  # Puede ser el ID o código
        valor = data.get("valor", 0)
        origen = data.get("origen", "ACTIVIDAD")
        descripcion = data.get("descripcion", "")
        
        if not equipo_id or not sesion_id:
            return JsonResponse({"error": "equipo_id y sesion_id son requeridos"}, status=400)
        
        # Buscar sesión por código o ID
        try:
            if isinstance(sesion_id, str) and len(sesion_id) == 6:
                sesion = Sesion.objects.get(codigo_acceso=sesion_id.upper())
            else:
                sesion = Sesion.objects.get(id=sesion_id)
        except Sesion.DoesNotExist:
            return JsonResponse({"error": "Sesión no encontrada"}, status=404)
        
        equipo = Equipo.objects.get(id=equipo_id, sesion=sesion)
        
        # Crear token
        token = Token.objects.create(
            equipo=equipo,
            sesion=sesion,
            origen=origen,
            valor=valor,
            descripcion=descripcion
        )
        
        # Actualizar puntaje total del equipo
        equipo.puntaje_total += valor
        equipo.save()
        
        return JsonResponse({
            "status": "ok",
            "token_id": token.id,
            "nuevo_puntaje": equipo.puntaje_total
        })
    
    except Equipo.DoesNotExist:
        return JsonResponse({"error": "Equipo no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
