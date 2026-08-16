#!/bin/sh
set -eu

MODE="${1:-}"
AWS_PROFILE_NAME="${AWS_PROFILE:-academy}"
API_URL="${API_URL:-https://3mm6y2gvu1.execute-api.us-east-1.amazonaws.com/Prod}"
# Terraform también evalúa variables compartidas durante un apply dirigido.
# Conservamos el código del pool demo para que la prueba DynamoDB no vacíe la
# configuración de Cognito. Se puede sobreescribir mediante DEMO_ADMIN_CODE.
: "${DEMO_ADMIN_CODE:?Define DEMO_ADMIN_CODE fuera de Git}"
DEMO_TMP=""

cleanup() {
  if [ -n "$DEMO_TMP" ] && [ -d "$DEMO_TMP" ]; then
    rm -r "$DEMO_TMP"
  fi
}
trap cleanup EXIT

apply_endpoint() {
  endpoint="$1"
  AWS_PROFILE="$AWS_PROFILE_NAME" TF_VAR_demo_admin_code="$DEMO_ADMIN_CODE" terraform -chdir=terraform apply -auto-approve \
    -target='aws_lambda_function.game["create_session"]' \
    -target='aws_lambda_function.game["register_team"]' \
    -target='aws_lambda_function.game["analytics"]' \
    -var="game_dynamodb_primary_endpoint=$endpoint"
}

case "$MODE" in
  down)
    echo "Helpi mató el nodo principal (bromis)"
    apply_endpoint "http://127.0.0.1:9"
    echo "Finjamos que sigue vivo..."
    DEMO_TMP="$(mktemp -d)"
    curl -sS -D "$DEMO_TMP/headers" -o "$DEMO_TMP/body" -X POST "$API_URL/api/crear-sesion" \
      -H 'Content-Type: application/json' \
      -d '{"nombreProfesor":"DEMO FAILOVER us-west-2","facultad":"AWS Lab - us-east-1 inalcanzable","modalidadGrupos":"manual"}'
    data_region="$(sed -n 's/^[Xx]-[Mm]ision-[Dd]ata-[Rr]egion: *//p' "$DEMO_TMP/headers" | tr -d '\r')"
    session_code="$(sed -n 's/.*"codigo":"\([0-9][0-9]*\)".*/\1/p' "$DEMO_TMP/body" | head -n 1)"
    echo
    echo "Miren"
    echo "Región que atendió la escritura: ${data_region:-no informada}"
    echo "Código de sesión creado: ${session_code:-no detectado}"
    echo "Respuesta de la API:"
    sed -n '1,5p' "$DEMO_TMP/body"
    echo
    echo "  Región: us-west-2 (Oregon)"
    echo "  Tabla: mision-emprende-dev-game"
    echo "  Partition key PK = SESSION#${session_code:-CODIGO_MOSTRADO_ARRIBA}"
    echo "  Sort key SK = META"
    echo "  Evidencia dentro del ítem: writeRegion = us-west-2"
    ;;
  up)
    echo "restaurando a la tabla primaria (us-east-1)"
    apply_endpoint ""
    ;;
  status)
    AWS_PROFILE="$AWS_PROFILE_NAME" aws lambda get-function-configuration \
      --region us-east-1 \
      --function-name mision-emprende-dev-create-session \
      --query 'Environment.Variables.{Primaria:GAME_DYNAMODB_PRIMARY_REGION,EndpointSimulado:GAME_DYNAMODB_PRIMARY_ENDPOINT,Failover:GAME_DYNAMODB_FAILOVER_REGIONS}'
    ;;
  *)
    echo "Uso: AWS_PROFILE=academy $0 down|up|status" >&2
    exit 2
    ;;
esac
