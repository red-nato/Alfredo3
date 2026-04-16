from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import secrets


class Profesor(models.Model):
    """Profesor que crea y gestiona sesiones"""
    nombre = models.CharField(max_length=120)
    email = models.EmailField(unique=True, max_length=160)
    
    def __str__(self):
        return self.nombre


class Sesion(models.Model):
    """Sesión de juego con código de acceso único"""
    ESTADO_CHOICES = [
        ('EN_ESPERA', 'En Espera'),
        ('EN_CURSO', 'En Curso'),
        ('FINALIZADA', 'Finalizada'),
    ]
    
    profesor = models.ForeignKey(Profesor, on_delete=models.PROTECT, related_name='sesiones')
    codigo_acceso = models.CharField(max_length=16, unique=True, db_index=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='EN_ESPERA')
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    config_tiempos = models.JSONField(null=True, blank=True)  # Para configuraciones de tiempos por etapa
    creado_en = models.DateTimeField(auto_now_add=True)
    
    def generar_codigo(self):
        """Genera un código único de 6 caracteres"""
        if not self.codigo_acceso:
            while True:
                codigo = secrets.token_hex(3).upper()[:6]
                if not Sesion.objects.filter(codigo_acceso=codigo).exists():
                    self.codigo_acceso = codigo
                    break
        return self.codigo_acceso
    
    def save(self, *args, **kwargs):
        if not self.codigo_acceso:
            self.generar_codigo()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Sesión {self.codigo_acceso} - {self.estado}"


class Alumno(models.Model):
    """Alumno/Estudiante con su información personal"""
    nombre = models.CharField(max_length=120)
    carrera = models.CharField(max_length=120, default='Sin definir')  # Área de estudio
    email = models.EmailField(unique=True, null=True, blank=True, max_length=160)
    
    class Meta:
        verbose_name_plural = "Alumnos"
    
    def __str__(self):
        return f"{self.nombre} - {self.carrera}"


class Equipo(models.Model):
    """Equipo de trabajo en una sesión"""
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='equipos')
    nombre = models.CharField(max_length=120)
    puntaje_total = models.IntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['sesion', 'nombre']]  # Un equipo no puede tener el mismo nombre en la misma sesión
        verbose_name_plural = "Equipos"
    
    def __str__(self):
        return f"{self.nombre} (Sesión: {self.sesion.codigo_acceso})"


class EquipoAlumno(models.Model):
    """Tabla intermedia: Relación Many-to-Many entre Equipo y Alumno"""
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='miembros')
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='participantes')
    alumno = models.ForeignKey(Alumno, on_delete=models.PROTECT, related_name='equipos')
    
    class Meta:
        unique_together = [
            ['equipo', 'alumno'],  # Un alumno no puede estar dos veces en el mismo equipo
            ['alumno', 'sesion'],  # Un alumno solo puede estar en un equipo por sesión
        ]
        verbose_name_plural = "Equipo Alumnos"
    
    def __str__(self):
        return f"{self.alumno.nombre} en {self.equipo.nombre}"


class Token(models.Model):
    """Tokens ganados por los equipos"""
    ORIGEN_CHOICES = [
        ('ACTIVIDAD', 'Actividad'),
        ('EVALUACION', 'Evaluación'),
        ('BONUS', 'Bonus'),
    ]
    
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='tokens_ganados')
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='tokens')
    origen = models.CharField(max_length=20, choices=ORIGEN_CHOICES)
    valor = models.IntegerField()
    creado_en = models.DateTimeField(auto_now_add=True)
    descripcion = models.CharField(max_length=200, blank=True, null=True)  # Descripción opcional
    
    class Meta:
        verbose_name_plural = "Tokens"
    
    def __str__(self):
        return f"{self.equipo.nombre}: +{self.valor} tokens ({self.origen})"


class Pitch(models.Model):
    """Pitch presentado por un equipo"""
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('ENTREGADO', 'Entregado'),
        ('VALIDADO', 'Validado'),
    ]
    
    equipo = models.OneToOneField(Equipo, on_delete=models.CASCADE, related_name='pitch', primary_key=True)
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='pitches')
    nombre_emprendimiento = models.CharField(max_length=150)
    guion = models.TextField(blank=True, null=True)
    media_url = models.URLField(max_length=500, blank=True, null=True)
    duracion_seg = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(180)]
    )
    presentado_en = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    
    class Meta:
        verbose_name_plural = "Pitches"
    
    def __str__(self):
        return f"Pitch: {self.nombre_emprendimiento} - {self.equipo.nombre}"


class Desafio(models.Model):
    """Desafío/temática disponible en el juego"""
    TEMATICA_CHOICES = [
        ('SALUD', 'Salud'),
        ('SUSTENTABILIDAD', 'Sustentabilidad'),
        ('EDUCACION', 'Educación'),
        ('ADULTOS_MAYORES', 'Adultos Mayores'),
        ('FASTFASHION_DESECHOS', 'Fast Fashion y Desechos'),
        ('SUSTENTABILIDAD_AGUA', 'Sustentabilidad del Agua'),
    ]
    
    tematica = models.CharField(max_length=30, choices=TEMATICA_CHOICES)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    personaje_id = models.IntegerField(null=True, blank=True)  # Referencia a personaje (puede ser JSON o FK)
    
    class Meta:
        verbose_name_plural = "Desafíos"
    
    def __str__(self):
        return f"{self.titulo} ({self.tematica})"


class EquipoDesafio(models.Model):
    """Desafío elegido por un equipo"""
    equipo = models.OneToOneField(Equipo, on_delete=models.CASCADE, related_name='desafio_elegido', primary_key=True)
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='desafios_elegidos')
    desafio = models.ForeignKey(Desafio, on_delete=models.PROTECT, related_name='equipos')
    elegido_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Equipo Desafíos"
    
    def __str__(self):
        return f"{self.equipo.nombre} eligió: {self.desafio.titulo}"
