# Pruebas en AWS Lab

Los comandos usan el perfil `academy`, la tabla global `mision-emprende-dev-game` y las regiones `us-east-1` y `us-west-2`. No pegues credenciales en este archivo ni en el chat; configúralas localmente con `aws configure --profile academy`.

## 1. Verificar la tabla global

```bash
AWS_PROFILE=academy aws dynamodb describe-table \
  --region us-east-1 \
  --table-name mision-emprende-dev-game \
  --query 'Table.{Estado:TableStatus,Replicas:Replicas[*].{Region:RegionName,Estado:ReplicaStatus}}'
```

Debe aparecer la réplica de `us-west-2` con estado `ACTIVE`. Es una sola tabla global con una réplica física en cada región, no dos tablas independientes.

## 2. Prueba automática bidireccional

```bash
AWS_PROFILE=academy \
TABLE_NAME=mision-emprende-dev-game \
PRIMARY_REGION=us-east-1 \
REPLICA_REGION=us-west-2 \
node src/scripts/verify-global-table-replication.js
```

La prueba crea un elemento en `us-east-1`, espera hasta verlo en `us-west-2`, lo actualiza en `us-west-2`, confirma el cambio en `us-east-1` y finalmente lo elimina. La replicación es eventual: un retraso breve es normal.

Para conservar el elemento y revisarlo manualmente en la consola, agrega `--keep` al final. Después elimínalo desde cualquiera de las regiones.

## 3. Demostración visual en la consola

1. Abre **DynamoDB > Tables > mision-emprende-dev-game > Explore table items** en `us-east-1`.
2. Ejecuta el script anterior con `--keep` y busca la partición que comienza con `REPLICATION_PROBE#`.
3. Cambia la región de la consola a `us-west-2` y vuelve a abrir la misma tabla: aparecerá el mismo elemento.
4. Edita `status` a `updated-from-west` en `us-west-2`.
5. Regresa a `us-east-1`, refresca la vista y confirma el cambio.
6. Elimina el elemento de prueba y comprueba que la eliminación también se replica.

Evita editar simultáneamente el mismo atributo en ambas regiones durante la demostración; las tablas globales resuelven escrituras concurrentes con la regla de la última escritura.

## 4. Generar datos sintéticos de analítica

```bash
AWS_PROFILE=academy AWS_REGION=us-east-1 \
API_URL=https://3mm6y2gvu1.execute-api.us-east-1.amazonaws.com/Prod \
SIM_SESSIONS=5 SIM_TEAMS=10 SIM_CLICKS=12 \
node src/scripts/simulate-analytics-load.js
```

Esta configuración crea 5 sesiones, 50 equipos y 3.000 eventos. Los nombres de sesión y equipo comienzan con `Simulación KPI` y `SIM-`, respectivamente. Los eventos quedan tanto en DynamoDB como en archivos NDJSON particionados en S3.

## 5. Consultar los KPI en Athena

En **Athena > Query editor**, primero cambia el workgroup `primary` por `mision-emprende-dev-analytics` (botón **Workgroup** en la barra superior) y luego selecciona la base `mision_emprende_dev_analytics`.

El workgroup del proyecto obliga a usar esta salida, que Terraform crea y configura automáticamente:

```text
s3://mision-emprende-dev-analytics-695835257252/athena-results/
```

El mensaje `No output location provided` significa que la consola sigue en `primary`; elegir una base de datos no cambia el workgroup. Como alternativa, entra a **Settings > Manage** y configura esa ruta como Query result location. Ajusta la fecha UTC a la fecha en que ejecutaste la simulación:

```sql
SELECT
  stage,
  count_if(event_type = 'click') AS clicks,
  round(avg(CASE WHEN event_type = 'stage_complete' THEN duration_ms END) / 1000.0, 1) AS segundos_promedio,
  round(approx_percentile(CASE WHEN event_type = 'stage_complete' THEN duration_ms / 1000.0 END, 0.95), 1) AS segundos_p95,
  count_if(event_type = 'stage_complete' AND timed_out) AS timeouts,
  count_if(event_type = 'click' AND action LIKE 'help_open%') AS aperturas_ayuda,
  count_if(event_type = 'word_found') AS palabras_encontradas
FROM interaction_events
WHERE year = '2026' AND month = '08' AND day = '12'
GROUP BY stage
ORDER BY stage;
```

Los KPI cubren clics, tiempo promedio, percentil 95 y abandonos por tiempo agotado en cada etapa. También se registran aperturas de ayuda y palabras encontradas para detectar etapas confusas o difíciles.

## 6. Demostración segura de caída y failover

La forma más rápida durante la presentación es:

```bash
chmod +x demo-dynamodb-node-failure.sh
AWS_PROFILE=academy ./demo-dynamodb-node-failure.sh down
```

El comando simula que el nodo `us-east-1` es inalcanzable, crea una sesión y muestra `Región que atendió la escritura: us-west-2` junto con el código exacto. El juego continúa escribiendo en oeste.

Sin cerrar la terminal, compruébalo visualmente en AWS:

1. En la esquina superior derecha de AWS Console cambia la región a **Oregon (`us-west-2`)**.
2. Entra a **DynamoDB > Tables > mision-emprende-dev-game > Explore table items**.
3. Selecciona **Query** y después **Table**.
4. En `PK (Partition key)` elige **Equals** y pega `SESSION#CODIGO`, reemplazando `CODIGO` por el que imprimió el script.
5. En `SK (Sort key)` elige **Equals** y escribe `META`.
6. Pulsa **Run**. Debe aparecer el ítem con `nombreProfesor = DEMO FAILOVER us-west-2` y `writeRegion = us-west-2`.
7. En otra pestaña ejecuta `AWS_PROFILE=academy ./demo-dynamodb-node-failure.sh status`: debe mostrar `EndpointSimulado = http://127.0.0.1:9`.

La tabla global replica el ítem rápidamente a Virginia. Si consultas la misma clave allí, también verás `writeRegion = us-west-2`: el registro que aparece en Virginia es la copia replicada de la escritura atendida por Oregon. La prueba del failover es la combinación del endpoint primario inalcanzable, la región informada por la API y ese atributo persistido.

Al terminar la demostración, restaura obligatoriamente la conexión normal:

```bash
AWS_PROFILE=academy ./demo-dynamodb-node-failure.sh up
```

No borres una réplica para simular una caída. En una Global Table ambas regiones forman una sola tabla lógica; borrar una réplica cambia la topología y puede destruir datos. La tabla tiene protección de borrado y PITR intencionalmente.

El backend intenta la región preferida y, ante una tabla inexistente o un error regional recuperable, usa `us-west-2`. Cada respuesta de la API expone `X-Mision-Data-Region` para demostrar qué réplica atendió la operación.

Para simular que la aplicación perdió por completo la tabla primaria, inyecta un endpoint local cerrado. Esto no borra datos: la conexión a este falla y el mismo request continúa automáticamente en oeste.

```bash
AWS_PROFILE=academy TF_VAR_demo_admin_code=1234 terraform -chdir=terraform apply \
  -var-file=terraform.tfvars \
  -var='game_dynamodb_primary_endpoint=http://127.0.0.1:9'
```

Crea una sesión y observa el encabezado:

```bash
curl -i -X POST \
  https://3mm6y2gvu1.execute-api.us-east-1.amazonaws.com/Prod/api/crear-sesion \
  -H 'Content-Type: application/json' \
  -d '{"nombreProfesor":"Demo failover","facultad":"Laboratorio","modalidadGrupos":"manual"}'
```

Debe responder `200` y `X-Mision-Data-Region: us-west-2`. Conserva el `codigo` de la respuesta, registra un equipo desde el juego y luego búscalo en **Explore table items** en `us-west-2`. Al refrescar la misma tabla en `us-east-1`, aparecerá por replicación. El API sigue en `us-east-1`, pero las Lambdas escriben en la réplica oeste.

También puedes comprobar el elemento de sesión por terminal, sustituyendo `123456` por el código real:

```bash
for REGION in us-west-2 us-east-1; do
  AWS_PROFILE=academy aws dynamodb get-item \
    --region "$REGION" \
    --table-name mision-emprende-dev-game \
    --key '{"PK":{"S":"SESSION#123456"},"SK":{"S":"META"}}' \
    --consistent-read
done
```

Para volver a la región normal:

```bash
AWS_PROFILE=academy TF_VAR_demo_admin_code=1234 terraform -chdir=terraform apply \
  -var-file=terraform.tfvars \
  -var='game_dynamodb_primary_endpoint='
```

El experimento FIS `dynamodb-replication-pause` es otra demostración: pausa temporalmente la replicación, no derriba el servicio local. Requiere un rol FIS y una alarma de detención que AWS Academy podría no permitir crear.

## 7. Cognito después de reiniciar el laboratorio

Cognito y sus usuarios no se desactivan al pulsar **End Lab** mientras la cuenta conserve los recursos. Sí caducan las credenciales `academy` y los tokens de login del navegador.

1. Renueva localmente `aws_access_key_id`, `aws_secret_access_key` y `aws_session_token` del perfil `academy`. Nunca los pegues en un chat ni los guardes en Git.
2. Comprueba el acceso con `AWS_PROFILE=academy aws sts get-caller-identity`.
3. Abre `panel-admin/index.html`, cierra la sesión antigua si aparece y vuelve a entrar.
4. Para crear otro administrador, abre **Parámetros > Administradores de Cognito**, escribe correo y contraseña y pulsa **Crear administrador**. Solo un usuario ya autenticado del grupo `Admins` puede invocar esa operación.

Como alternativa de terminal, configura `.env.admin` a partir de `.env.admin.example` y ejecuta:

```bash
COGNITO_USER_POOL_ID=$(AWS_PROFILE=academy terraform -chdir=terraform output -raw admin_user_pool_id) \
AWS_PROFILE=academy ./create-admin.sh
```
