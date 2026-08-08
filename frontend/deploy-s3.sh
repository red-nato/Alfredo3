#!/bin/sh
# Sube frontend/ a un bucket S3 con hosting estático, replicando las rutas
# "limpias" que tenía Django (/profesor/, /panel-admin/) e inyectando la URL
# real de la API SOLO en la copia subida — el 00_env.js del repo se queda con
# PROD_API_BASE_URL vacío para no hardcodear un valor que caduca en cada
# redeploy (los stacks de AWS Academy Learner Lab se resetean entre sesiones).
#
# Uso:
# BUCKET=mi-bucket API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/Prod \
# COGNITO_USER_POOL_ID=... COGNITO_CLIENT_ID=... COGNITO_HOSTED_UI_DOMAIN=https://... \
# ./frontend/deploy-s3.sh

set -eu

: "${BUCKET:?Define BUCKET=<nombre-del-bucket>}"
: "${API_URL:?Define API_URL=<ApiUrl que imprime sam deploy>}"
: "${COGNITO_USER_POOL_ID:?Define COGNITO_USER_POOL_ID=<AdminUserPoolId>}"
: "${COGNITO_CLIENT_ID:?Define COGNITO_CLIENT_ID=<AdminUserPoolClientId>}"
: "${COGNITO_HOSTED_UI_DOMAIN:?Define COGNITO_HOSTED_UI_DOMAIN=<AdminHostedUiDomain>}"

FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

echo "Sincronizando static/ ..."
aws s3 sync "$FRONTEND_DIR/static" "s3://$BUCKET/static" --delete

echo "Subiendo páginas con rutas limpias ..."
aws s3 cp "$FRONTEND_DIR/index.html" "s3://$BUCKET/index.html" --content-type "text/html"
aws s3 cp "$FRONTEND_DIR/profesor.html" "s3://$BUCKET/profesor" --content-type "text/html"
aws s3 cp "$FRONTEND_DIR/panel-admin.html" "s3://$BUCKET/panel-admin/index.html" --content-type "text/html"

echo "Inyectando API_URL y configuración pública de Cognito solo en la copia S3 de 00_env.js ..."
sed \
  -e "s|const PROD_API_BASE_URL = '';|const PROD_API_BASE_URL = '${API_URL}';|" \
  -e "s|const COGNITO_USER_POOL_ID = '';|const COGNITO_USER_POOL_ID = '${COGNITO_USER_POOL_ID}';|" \
  -e "s|const COGNITO_CLIENT_ID = '';|const COGNITO_CLIENT_ID = '${COGNITO_CLIENT_ID}';|" \
  -e "s|const COGNITO_HOSTED_UI_DOMAIN = '';|const COGNITO_HOSTED_UI_DOMAIN = '${COGNITO_HOSTED_UI_DOMAIN}';|" \
  "$FRONTEND_DIR/static/misionemprende/js/00_env.js" > "$TMP_ENV"
aws s3 cp "$TMP_ENV" "s3://$BUCKET/static/misionemprende/js/00_env.js" --content-type "text/javascript"

echo "Listo: http://${BUCKET}.s3-website-$(aws configure get region).amazonaws.com/"
