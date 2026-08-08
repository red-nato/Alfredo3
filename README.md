# Misión Emprende Serverless

Backend Node.js independiente del Django legado. La dependencia siempre apunta hacia dentro:

```text
API Gateway → Lambda handler → controller → use case → repository port → DynamoDB
```

Cada endpoint es una Lambda SAM distinta, aunque comparten el dominio y los adaptadores. Se conserva el prefijo histórico `/api`, heredado del Django legado (ver [MIGRACION.md](MIGRACION.md)).

El frontend ya no vive en el proyecto Django: está migrado y adaptado dentro de [`frontend/`](frontend/) (HTML estático + el mismo JS de siempre, sin build step). El detalle de qué se adaptó y qué patrones de Clean Architecture ya trae el backend está en [REPORTE_ARQUITECTURA.md](REPORTE_ARQUITECTURA.md) — no se repite aquí para no duplicar contenido.

## Desarrollo local

**Terminal 1** — backend (desde esta carpeta):

```bash
docker compose -f docker-compose.local.yml up -d
npm --prefix src run local:table
sam build --region us-east-1
sam local start-api --region us-east-1 --env-vars env.local.json
```

Queda escuchando en `http://localhost:3000`.

**Terminal 2** — frontend (servidor estático sin dependencias, incluido en el repo):

```bash
node frontend/serve.mjs 8080
```

Abre `http://localhost:8080/` (juego), `http://localhost:8080/profesor/` (panel profesor) o `http://localhost:8080/panel-admin/` (panel administrativo) — mismas rutas "limpias" que tenía Django. `frontend/static/misionemprende/js/00_env.js` detecta que el hostname es `localhost` y apunta automáticamente a `http://localhost:3000`; no hace falta tocar `localStorage` a mano.

**Terminal 3** — smoke test directo a la API:

```bash
curl -i http://localhost:3000/health
curl -i -X POST http://localhost:3000/api/crear-sesion \
  -H 'Content-Type: application/json' \
  -d '{"nombreProfesor":"Ana","facultad":"FING","modalidadGrupos":"manual"}'
```

Usa `npm --prefix src run local:table:reset` solamente para borrar y recrear la base local.

## Modelo DynamoDB

Tabla única `GameTable`:

| Ítem | PK | SK | Razón |
|---|---|---|---|
| Sesión | `SESSION#<codigo>` | `META` | Lectura directa de estado. |
| Equipo | `SESSION#<codigo>` | `TEAM#<nombre-normalizado>` | Un `Query` recupera los equipos de la sesión; la llave impide duplicar nombres. |
| Bloqueo de integrante | `SESSION#<codigo>` | `MEMBER#<nombre-normalizado>` | Transacción que evita que una persona entre a dos equipos. |
| Token | `SESSION#<codigo>` | `TOKEN#<fecha>#<uuid>` | Auditoría inmutable y puntaje agregado atómicamente. |

`GSI1` busca un equipo por `equipo_id`; `GSI2` lista sesiones para el panel administrativo. No se replica el modelo SQL ni se usan joins.

## Despliegue

### Backend

```bash
sam deploy --guided --region us-east-1
```

Las Lambdas de negocio, incluida `FinishPhase`, incluyen alias `live` y `Canary10Percent5Minutes`: cada versión nueva recibe 10% del tráfico durante cinco minutos antes de reemplazar la anterior. Para producción real, añade alarmas de `Errors` y `Duration` de CloudWatch a `DeploymentPreference` antes de usar datos reales.

### Panel administrativo con Cognito

El panel administrativo usa el Hosted UI de Cognito; ya no hay usuarios ni
contraseñas en el JavaScript. El API Gateway protege las rutas administrativas
y el backend exige además el grupo Cognito `Admins`.

Al desplegar el backend, proporciona la URL definitiva del panel para que sea
el callback permitido de Cognito:

```bash
sam deploy --parameter-overrides \
  ExecutionRoleName=<tu-rol> \
  FrontendCallbackUrl=http://<bucket>.s3-website-us-east-1.amazonaws.com/panel-admin/
```

Crea el primer usuario y asígnalo al grupo después de desplegar:

```bash
aws cognito-idp admin-create-user --user-pool-id <AdminUserPoolId> \
  --username admin@ejemplo.cl --user-attributes Name=email,Value=admin@ejemplo.cl
aws cognito-idp admin-add-user-to-group --user-pool-id <AdminUserPoolId> \
  --username admin@ejemplo.cl --group-name Admins
```

**Si tu cuenta es un AWS Academy Learner Lab** (rol asumido `voclabs/...`): `iam:CreateRole` está bloqueado, así que SAM no puede crear un rol por Lambda ni el rol de CodeDeploy. El template ya reutiliza el rol `LabRole` provisionado por el lab (parámetro `ExecutionRoleName` en `template.yaml`, default `LabRole`). Si tu rol reutilizable tiene otro nombre: `sam deploy --parameter-overrides ExecutionRoleName=<tu-rol>`. Si un deploy anterior quedó en `ROLLBACK_COMPLETE`, hay que borrarlo antes de reintentar: `aws cloudformation delete-stack --stack-name <stack>`.

### Frontend

Bucket S3 con hosting estático (sin CloudFront; no hace falta rol IAM nuevo, funciona en Learner Lab). Se crea una vez:

```bash
BUCKET=<tu-bucket>   # nombre único global, ej: mision-emprende-frontend-<account-id>
aws s3api create-bucket --bucket "$BUCKET" --region us-east-1
aws s3api put-bucket-website --bucket "$BUCKET" --website-configuration '{"IndexDocument":{"Suffix":"index.html"}}'
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3api put-bucket-policy --bucket "$BUCKET" --policy '{
  "Version":"2012-10-17",
  "Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::'"$BUCKET"'/*"}]
}'
```

Cada vez que haya cambios en `frontend/` o un nuevo `ApiUrl` (por ejemplo tras recrear el stack en un Learner Lab), usa el script incluido — sube `index.html`, `profesor.html` y `panel-admin.html` como `profesor/index.html` y `panel-admin/index.html` (mismas rutas limpias que Django) e inyecta la URL de la API **solo en la copia subida**, sin tocar `00_env.js` del repo:

```bash
BUCKET=<tu-bucket> API_URL=<ApiUrl de sam deploy> \
COGNITO_USER_POOL_ID=<AdminUserPoolId> \
COGNITO_CLIENT_ID=<AdminUserPoolClientId> \
COGNITO_HOSTED_UI_DOMAIN=<AdminHostedUiDomain> \
./frontend/deploy-s3.sh
```

El sitio queda en `http://<bucket>.s3-website-<region>.amazonaws.com/`.

Consulta [MIGRACION.md](MIGRACION.md) para las reglas y la correspondencia Django → Serverless, y [REPORTE_ARQUITECTURA.md](REPORTE_ARQUITECTURA.md) para los patrones de diseño y los bugs corregidos en esta migración (timer/sincronización, roles IAM en Learner Lab).

## Resiliencia y FIS

[`fis/finish-phase-experiments.yaml`](fis/finish-phase-experiments.yaml) contiene
experimentos FIS explícitamente orientados a `FinishPhase`: latencia y errores
transitorios. Consulta [`fis/README.md`](fis/README.md) antes de desplegarlos;
las acciones FIS para Lambda requieren su extensión y bucket de configuración.

## Verificación continua

El workflow [`.github/workflows/verify.yml`](.github/workflows/verify.yml) se
ejecuta en cada push y pull request: instala dependencias, corre tests, valida
sintaxis JavaScript, SAM y la plantilla FIS.
