"""
Lambda: generar-nombre-equipo
------------------------------
Genera un nombre aleatorio para un equipo de "Misión Emprende"
combinando un adjetivo + un sustantivo, ambos temáticos a
emprendimiento / innovación / gamificación.

Se invoca vía Amazon API Gateway (HTTP API) con método GET.

Respuesta:
{
    "status": "ok",
    "nombre": "Los Fenix Disruptivos"
}
"""

import json
import random

ADJETIVOS = [
    "Disruptivos", "Innovadores", "Visionarios", "Imparables",
    "Audaces", "Estrategicos", "Creativos", "Ambiciosos",
    "Ingeniosos", "Emprendedores", "Resilientes", "Brillantes",
    "Legendarios", "Invencibles", "Astutos", "Pioneros",
]

SUSTANTIVOS = [
    "Fenix", "Halcones", "Titanes", "Vanguardia", "Cohete",
    "Chispa", "Nexo", "Impulso", "Horizonte", "Catalizador",
    "Brujula", "Vortice", "Prisma", "Quantum", "Zenit", "Aurora",
]

PREFIJOS = ["Los", "Las", "Team", "Grupo"]


def _generar_nombre():
    prefijo = random.choice(PREFIJOS)
    sustantivo = random.choice(SUSTANTIVOS)
    adjetivo = random.choice(ADJETIVOS)
    return f"{prefijo} {sustantivo} {adjetivo}"


# Cabeceras CORS: el frontend llama a este Lambda desde otro origen
# (el dominio donde vive Django), así que hay que habilitarlo siempre.
_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def lambda_handler(event, context):
    # Soporta pre-flight de CORS (API Gateway HTTP API lo puede mandar
    # directo al Lambda si no se configura CORS nativo en la API).
    http_method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "GET"
    )
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": _CORS_HEADERS,
            "body": "",
        }

    nombre = _generar_nombre()

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            **_CORS_HEADERS,
        },
        "body": json.dumps({"status": "ok", "nombre": nombre}),
    }
