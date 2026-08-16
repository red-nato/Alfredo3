# Misión Emprende Serverless

Backend Node.js independiente del Django legado. La dependencia siempre apunta hacia dentro:

```text
API Gateway → Lambda handler → controller → use case → repository port → DynamoDB
```

Cada endpoint es una Lambda distinta, aunque comparten el dominio y los adaptadores. Terraform es la fuente de verdad del despliegue; `template.yaml` queda únicamente para `sam local`. Se conserva el prefijo histórico `/api`, heredado del Django legado (ver [MIGRACION.md](MIGRACION.md)).

El frontend ya no vive en el proyecto Django: está migrado y adaptado dentro de [`frontend/`](frontend/) (HTML estático + el mismo JS de siempre, sin build step). El detalle de qué se adaptó y qué patrones de Clean Architecture ya trae el backend está en [REPORTE_ARQUITECTURA.md](REPORTE_ARQUITECTURA.md) — no se repite aquí para no duplicar contenido.

`dev` no es otro frontend ni otro backend. Es el **ambiente de desarrollo** y forma parte del nombre de los recursos (`mision-emprende-dev-*`) para distinguirlos de futuros ambientes `test` o `prod`:

- **Frontend:** las páginas HTML, CSS, imágenes y JavaScript de `frontend/`. En AWS se guardan en S3 y se entregan por API Gateway/Lambda.
- **Backend:** API Gateway y las Lambdas Node.js de `src/`; reciben las operaciones del juego y usan DynamoDB, Cognito y S3.
- **Analytics:** los eventos que el backend copia a S3, el catálogo Glue y las consultas Athena.
- **`dev`:** etiqueta del mismo despliegue, no una página a la que debas entrar.

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
| Evento KPI | `SESSION#<codigo>` | `ANALYTICS#<uuid>` | Interacción idempotente para métricas operacionales. |

`GSI1` busca un equipo por `equipo_id`; `GSI2` lista sesiones para el panel administrativo. Terraform activa streams, PITR y una réplica global configurable (`us-west-2` en el AWS Lab actual). No se replica el modelo SQL ni se usan joins.

## Despliegue con Terraform y Ansible

Terraform declara API Gateway, Lambdas, Cognito, la tabla global DynamoDB,
CloudFront/S3, el data lake de interacción (S3 + Glue + Athena) y las plantillas
FIS. Ansible orquesta dependencias Node, plan/apply, publicación del frontend,
invalidación de CloudFront y alta opcional del primer admin.

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# revisa región réplica, protección de borrado y rol existente
ansible-playbook ansible/deploy.yml
```

Para crear el primer administrador en la misma ejecución, prepara `.env.admin`
y ejecuta `ansible-playbook ansible/deploy.yml -e create_admin=true`. El login usa
Authorization Code + PKCE, valida `issuer`, `audience`, expiración y grupo
`Admins`; API Gateway vuelve a verificar la firma y el backend exige el grupo.

En AWS Academy se reutiliza `LabRole` porque el laboratorio normalmente bloquea
la creación de roles. En una cuenta normal conviene entregar un rol existente de
mínimo privilegio mediante `execution_role_name`.

Si ya existe una tabla SAM con datos, no apliques directamente: sigue
[MIGRACION_TERRAFORM.md](MIGRACION_TERRAFORM.md) para importarla sin reemplazo.

Consulta [MIGRACION.md](MIGRACION.md) para las reglas y la correspondencia Django → Serverless, y [REPORTE_ARQUITECTURA.md](REPORTE_ARQUITECTURA.md) para los patrones de diseño y los bugs corregidos en esta migración (timer/sincronización, roles IAM en Learner Lab).

## Resiliencia y FIS

[`fis/finish-phase-experiments.yaml`](fis/finish-phase-experiments.yaml) contiene
experimentos FIS para `FinishPhase` (latencia y errores) y para pausar la
replicación de la tabla global DynamoDB. Consulta [`fis/README.md`](fis/README.md) antes de desplegarlos;
las acciones FIS para Lambda requieren su extensión y bucket de configuración.

## Verificación continua

El workflow [`.github/workflows/verify.yml`](.github/workflows/verify.yml) se
ejecuta en cada push y pull request: instala dependencias, corre tests, valida
sintaxis JavaScript, Terraform, Ansible y la plantilla FIS.
