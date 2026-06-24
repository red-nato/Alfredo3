from django.urls import path
from .views import (
    registrar_equipo,
    obtener_equipos_sesion,
    agregar_tokens,
    obtener_equipos_sesion,
    crear_sesion_profesor,
    obtener_admin_stats,
    validar_sesion,
    obtener_estado_juego,
    equipo_termina_fase,
    admin_start,
    admin_pause,
    admin_next,
    equipo_listo,
    terminar_pitch,
)

urlpatterns = [
    path("registrar-equipo/", registrar_equipo, name="registrar-equipo"),
    path("equipos-sesion/<str:codigo_sesion>/", obtener_equipos_sesion, name="equipos-sesion"),
    path("agregar-tokens/", agregar_tokens, name="agregar-tokens"),
    path('crear-sesion/', crear_sesion_profesor),
    path('obtener-equipos/<str:codigo>/', obtener_equipos_sesion),
    path('admin-stats/', obtener_admin_stats, name='admin_stats'),
    path('validar-sesion/', validar_sesion, name='validar-sesion'),
    path('estado-juego/', obtener_estado_juego, name='estado_juego'),
    path('equipo/terminar-fase/', equipo_termina_fase, name='equipo_termina_fase'),
    path('admin/start/', admin_start, name='admin_start'),
    path('admin/pause/', admin_pause, name='admin_pause'),
    path('admin/next/', admin_next, name='admin_next'),
    path('equipo-listo/', equipo_listo, name='equipo_listo'),
    path('terminar-pitch/', terminar_pitch, name='terminar_pitch'),

]
