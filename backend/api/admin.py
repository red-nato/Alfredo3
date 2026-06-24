from django.contrib import admin
from .models import (
    Profesor, Sesion, Alumno, Equipo, 
    EquipoAlumno, Token, Pitch, Desafio, EquipoDesafio
)


@admin.register(Profesor)
class ProfesorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'email')
    search_fields = ('nombre', 'email')


@admin.register(Sesion)
class SesionAdmin(admin.ModelAdmin):
    list_display = ('codigo_acceso', 'profesor', 'estado', 'fecha_inicio', 'creado_en')
    list_filter = ('estado', 'creado_en')
    search_fields = ('codigo_acceso', 'profesor__nombre')
    readonly_fields = ('codigo_acceso', 'creado_en')


@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'carrera', 'email')
    search_fields = ('nombre', 'carrera', 'email')
    list_filter = ('carrera',)


class EquipoAlumnoInline(admin.TabularInline):
    model = EquipoAlumno
    extra = 1
    autocomplete_fields = ('alumno',)


@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'sesion', 'puntaje_total', 'creado_en')
    list_filter = ('sesion', 'creado_en')
    search_fields = ('nombre', 'sesion__codigo_acceso')
    inlines = [EquipoAlumnoInline]
    readonly_fields = ('creado_en',)


@admin.register(EquipoAlumno)
class EquipoAlumnoAdmin(admin.ModelAdmin):
    list_display = ('equipo', 'alumno', 'sesion')
    list_filter = ('sesion',)
    search_fields = ('equipo__nombre', 'alumno__nombre', 'sesion__codigo_acceso')
    autocomplete_fields = ('equipo', 'alumno', 'sesion')


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ('equipo', 'sesion', 'origen', 'valor', 'creado_en')
    list_filter = ('origen', 'creado_en', 'sesion')
    search_fields = ('equipo__nombre', 'sesion__codigo_acceso', 'descripcion')
    readonly_fields = ('creado_en',)


@admin.register(Pitch)
class PitchAdmin(admin.ModelAdmin):
    list_display = ('equipo', 'sesion', 'nombre_emprendimiento', 'estado', 'presentado_en')
    list_filter = ('estado', 'presentado_en', 'sesion')
    search_fields = ('nombre_emprendimiento', 'equipo__nombre', 'sesion__codigo_acceso')
    readonly_fields = ('presentado_en',)


@admin.register(Desafio)
class DesafioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tematica', 'personaje_id')
    list_filter = ('tematica',)
    search_fields = ('titulo', 'descripcion')


@admin.register(EquipoDesafio)
class EquipoDesafioAdmin(admin.ModelAdmin):
    list_display = ('equipo', 'desafio', 'sesion', 'elegido_en')
    list_filter = ('sesion', 'elegido_en')
    search_fields = ('equipo__nombre', 'desafio__titulo', 'sesion__codigo_acceso')
    readonly_fields = ('elegido_en',)
