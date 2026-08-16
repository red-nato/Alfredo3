#!/bin/sh
# Crea (o reemplaza) la cuenta admin en el User Pool de Cognito recién
# desplegado, y la agrega al grupo Admins — para no tener que hacer signup +
# verificación de email + agregar-a-grupo a mano cada vez que el stack de
# AWS Academy Learner Lab se resetea y Cognito nace de cero.
#
# Uso (después de Terraform/Ansible):
#   COGNITO_USER_POOL_ID=$(terraform -chdir=terraform output -raw admin_user_pool_id) \
#   ./create-admin.sh
#
# ADMIN_EMAIL y ADMIN_PASSWORD se leen de un archivo local ".env.admin"
# (mismo directorio que este script) que NO se commitea — está en .gitignore.
# La primera vez, copia .env.admin.example a .env.admin y pon tu clave real ahí.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.admin" ]; then
  . "$SCRIPT_DIR/.env.admin"
fi

: "${COGNITO_USER_POOL_ID:?Define COGNITO_USER_POOL_ID=<admin_user_pool_id de Terraform>}"
: "${ADMIN_EMAIL:?Falta ADMIN_EMAIL — cópialo desde .env.admin.example a .env.admin}"
: "${ADMIN_PASSWORD:?Falta ADMIN_PASSWORD — cópialo desde .env.admin.example a .env.admin}"

echo "Creando usuario ${ADMIN_EMAIL} en el pool ${COGNITO_USER_POOL_ID} ..."

# MessageAction=SUPPRESS: no manda correo de invitación (no hay SES configurado,
# y no lo necesitamos). email_verified=true: evita que Cognito exija verificar
# el correo antes de dejarlo loguearse.
aws cognito-idp admin-create-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --user-attributes Name=email,Value="$ADMIN_EMAIL" Name=email_verified,Value=true \
  --message-action SUPPRESS \
  || echo "  (ya existía — seguimos para fijar contraseña y grupo)"

echo "Fijando contraseña permanente ..."
aws cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --permanent

echo "Agregando al grupo Admins ..."
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --group-name Admins

echo "Listo. Login: ${ADMIN_EMAIL} / (la contraseña que definiste)"
