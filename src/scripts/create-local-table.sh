#!/bin/sh
set -eu

TABLE_NAME="${GAME_TABLE_NAME:-MisionEmprende-local}"
AWS_LOCAL="aws dynamodb --endpoint-url http://localhost:8000 --region us-east-1 --no-cli-pager"
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AWS_EC2_METADATA_DISABLED=true
export AWS_MAX_ATTEMPTS=1
# Algunos entornos universitarios/configuraciones de macOS definen un proxy
# global. DynamoDB Local debe conectarse directamente al puerto de Docker.
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NO_PROXY=localhost,127.0.0.1
export no_proxy=localhost,127.0.0.1

echo "Conectando a DynamoDB Local para preparar ${TABLE_NAME}..."

if $AWS_LOCAL describe-table --table-name "$TABLE_NAME" --cli-connect-timeout 3 --cli-read-timeout 5 >/dev/null 2>&1; then
  if [ "${1:-}" != "--reset" ]; then
    echo "La tabla ${TABLE_NAME} ya existe."
    exit 0
  fi
  $AWS_LOCAL delete-table --table-name "$TABLE_NAME" >/dev/null
fi

$AWS_LOCAL create-table \
  --table-name "$TABLE_NAME" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S AttributeName=GSI2PK,AttributeType=S AttributeName=GSI2SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"GSI1PK","KeyType":"HASH"},{"AttributeName":"GSI1SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"GSI2","KeySchema":[{"AttributeName":"GSI2PK","KeyType":"HASH"},{"AttributeName":"GSI2SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  >/dev/null

echo "Tabla ${TABLE_NAME} creada."
