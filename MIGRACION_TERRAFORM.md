# Migración segura de SAM a Terraform

Terraform pasa a ser la fuente de verdad. `template.yaml` se conserva solo para
ejecución local con SAM y no debe volver a usarse para desplegar.

## Tabla DynamoDB existente

La tabla es el único recurso con datos irreemplazables. Antes de cualquier
cambio, habilita PITR o crea un backup y obtén el nombre físico del output SAM.
Luego:

1. Copia `terraform/terraform.tfvars.example` a `terraform/terraform.tfvars`.
2. Define `game_table_name` con el nombre físico exacto de la tabla actual.
3. Empieza temporalmente con `replica_regions = []`.
4. Ejecuta `npm ci --prefix src`, `terraform -chdir=terraform init` y
   `terraform -chdir=terraform import aws_dynamodb_table.game <nombre-fisico>`.
5. Ejecuta `terraform plan`. Si muestra `-/+` para la tabla, detente y alinea la
   configuración; nunca aceptes un reemplazo.
6. Cuando el plan no destruya la tabla, aplica. Después agrega la región réplica
   y vuelve a aplicar. Con `PAY_PER_REQUEST`, Terraform puede convertirla en
   tabla global en una sola actualización.

No cambies directamente un `AWS::DynamoDB::Table` de CloudFormation a
`AWS::DynamoDB::GlobalTable`: primero retén/desvincula el recurso SAM o importa
su estado a Terraform. Los recursos sin estado (API, Lambda, Cognito y frontend)
pueden coexistir durante la verificación y retirarse después del cambio de DNS.

## Corte

1. Despliega Terraform y publica el frontend con Ansible.
2. Crea el admin Cognito nuevo y valida login, grupo y endpoint `/api/admin-stats`.
3. Ejecuta un juego de prueba y verifica eventos en DynamoDB y Athena.
4. Comprueba `ReplicationLatency` y lectura de un ítem desde la réplica.
5. Cambia tráfico al dominio CloudFront nuevo.
6. Solo después, elimina el stack SAM preservando explícitamente la tabla que ya
   administra Terraform.
