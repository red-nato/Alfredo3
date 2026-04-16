from django.urls import path
from .views import (
    registrar_equipo,
    obtener_equipos_sesion,
    agregar_tokens,
    obtener_equipos_sesion,
    crear_sesion_profesor,
    obtener_admin_stats,
)

urlpatterns = [
    path("registrar-equipo/", registrar_equipo, name="registrar-equipo"),
    path("equipos-sesion/<str:codigo_sesion>/", obtener_equipos_sesion, name="equipos-sesion"),
    path("agregar-tokens/", agregar_tokens, name="agregar-tokens"),
    path('crear-sesion/', crear_sesion_profesor),
    path('obtener-equipos/<str:codigo>/', obtener_equipos_sesion),
    path('admin-stats/', obtener_admin_stats, name='admin_stats'),

]
