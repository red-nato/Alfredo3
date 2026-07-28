
# Reporte: patrones aplicados en el frontend y Clean Architecture del backend

## 1. Frontend (Django → estático): qué se modificó y por qué

| Cambio | Patrón | Motivo |
|---|---|---|
| `00_env.js` nuevo, cargado antes de `01_config.js` | **Resolución de entorno (Strategy)** | Un solo punto decide la base URL del API (`localhost:3000` en local, string vacío a rellenar en prod) en vez de tocar los ~30 call-sites de `apiFetch` repartidos en `02_core.js`-`05_globals.js`. Abierto a nuevos entornos sin modificar el código que ya funciona (Open/Closed). |
| `apiFetch()` de `01_config.js` | **Adapter** (ya existía) | No se tocó: ya envolvía `fetch` para desacoplar el resto del JS de saber si el backend es Django o Lambda. |
| `{% include "phases/X.html" %}` → contenido inlineado en `index.html` | **Resolución en "build time", no runtime** | Sin servidor de templates (Django) detrás, los includes se resolvieron una sola vez con un script Node desechable. El resultado es HTML plano, servible desde cualquier storage estático (disco local, S3). |
| `{% static '...' %}` → `/static/...` | Convención preservada | Se mantuvo la misma ruta absoluta que usaba Django (STATIC_URL). Esto evitó tocar el JS, que ya tenía rutas `/static/misionemprende/...` *hardcodeadas* en `02_core.js` (imágenes de personas de Fase 2). |
| `admin.html` → `panel-admin.html`; `serve.mjs` resuelve `/profesor/` y `/panel-admin/` sin extensión | **Convention over configuration** | Replica exactamente las rutas de `core/urls.py` del Django legado, para no sorprender a nadie que tuviera esas URLs guardadas. |
| `main2.js`, `templates/phases/opcional/*`, `3d/Lil-Finder-Print.zip` **no copiados** | YAGNI | `main2.js` es un monolito viejo que `main2.html` ya no incluye (confirmado por grep); los templates `opcional/` y el zip no están referenciados por ningún HTML/JS activo. No se migró código muerto. |
| Endpoints huérfanos del JS (`admin/kick`, `clear-all`, `update-config`, `agrupar-alumnos`, `enviar-evaluaciones`, `admin-ranking`) | Sin cambios | Ya documentados como pendientes en `MIGRACION.md`; no se inventaron Lambdas para ellos. Seguirán devolviendo 404 hasta que se validen con el profesor/equipo. |

**Auditoría de links hardcodeados**: se revisó todo `static/misionemprende/js/*.js` buscando `fetch(` fuera de `apiFetch()` y URLs `http(s)://` fuera de CDNs — no se encontró ningún bypass. El único valor de entorno que se edita a mano es `PROD_API_BASE_URL` dentro de `00_env.js` (un solo archivo, una sola constante, comentada); no queda disperso en el código de negocio.

## 2. Clean Architecture ya presente en `src/` (no se creó, ya estaba)

Regla de dependencia real, de afuera hacia adentro:

```
functions/*/handler.js  →  interfaces/controllers  →  application/usecases  →  domain
                                                              ↑
                                              infrastructure/repositories (implementa el puerto)
```

- **`domain/repositories/game-repository.js`** — puerto (interfaz) puro, con el comentario explícito *"la capa de aplicación nunca importa AWS SDK"*. Es la frontera de la regla de dependencia.
- **`domain/entities/session.js` / `domain/errors.js`** — helpers puros (`sessionCode`, `normalise`) y `DomainError` como tipo distinguible de errores de negocio (4xx) vs. errores de infraestructura (5xx). No hay clases anémicas, son funciones de dominio.
- **`application/usecases/game-usecases.js`** — `GameUseCases` recibe el repositorio por **inyección de constructor** y concentra *todas* las reglas de `MIGRACION.md` (código de sesión único con reintento, unicidad de equipo/integrante, avance de fase, subfases de pitch, agregación de `adminStats`). Cero conocimiento de HTTP o DynamoDB.
- **`infrastructure/repositories/dynamodb-game-repository.js`** — adapter concreto del puerto; traduce el dominio a `PutCommand`/`QueryCommand`/`TransactWriteCommand` sobre una tabla única (single-table design con `GSI1`/`GSI2`). Es el único archivo que conoce el modelo de acceso a datos.
- **`interfaces/controllers/game-controller.js`** — único lugar que conoce la forma del evento de API Gateway (`queryStringParameters`, `pathParameters`, `event.body`) y mapea `DomainError` → código HTTP. Es el "adapter de entrada".
- **`functions/_shared/create-handler.js`** — **Composition Root**: arma `GameController(GameUseCases(DynamoGameRepository()))` una vez y lo reutiliza en las 13 Lambdas de juego.
- **`functions/health/container.js`** — Composition Root independiente para `/health`, mostrando que cada Lambda arma su propio grafo de dependencias (nada de singletons compartidos entre features no relacionadas) — clave para el despliegue independiente por función que exige serverless.
- **`functions/<nombre>/handler.js`** — una línea cada uno; puro adapter entre el runtime Lambda y `createHandler(operation)`.

**Patrones nombrables**: Ports & Adapters (Hexagonal), Repository, Dependency Injection por constructor, Composition Root, Value objects como funciones puras, Guard clauses (`required(...)`) en el borde de los casos de uso.

## 3. Cómo probar local (ya verificado end-to-end)

```bash
docker compose -f docker-compose.local.yml up -d
npm --prefix src run local:table
sam build --region us-east-1
sam local start-api --region us-east-1 --env-vars env.local.json   # puerto 3000

node frontend/serve.mjs 8080   # puerto 8080, sin dependencias
```

Rutas del frontend: `/`, `/profesor/`, `/panel-admin/` (equivalentes a `home`, `profesor/`, `panel-admin/` de Django). `00_env.js` ya apunta a `localhost:3000` automáticamente cuando el hostname es `localhost`/`127.0.0.1`.

Antes de subir a AWS: correr `sam deploy --guided`, copiar el output `ApiUrl` dentro de `PROD_API_BASE_URL` en `frontend/static/misionemprende/js/00_env.js`, y subir la carpeta `frontend/` a S3/CloudFront.

## 4. Bug real encontrado en la "segunda vuelta" (timer y sincronización global)

El síntoma reportado ("el timer y la sincronización global solían fallar") tiene una causa concreta y verificada, **preexistente en el Django legado** (no introducida por la migración):

`04_admin.js` → `handleServerState()` (el manejador del polling cada 3s a `/api/estado-juego`) leía dos campos que la API **nunca envió, ni en Django ni en las Lambdas**:

1. `serverData.tiempo_restante` — al reanudar de una pausa hacía `this.startTimer(serverData.tiempo_restante / 60)`. Como el campo no existe, esto era `undefined / 60 = NaN`, rompiendo el timer global cada vez que el profesor pausaba y reanudaba el juego.
2. `serverData.ranking` — el backend siempre respondió `ranking_temporal` (confirmado leyendo `backend/api/views.py:607` en Django y probando en vivo contra la Lambda `gameState`). El ranking en memoria del cliente (`this.state.ranking`, leído en 3 sitios de `03_fases.js`) nunca se actualizaba durante la partida.

**Corrección aplicada** (`frontend/static/misionemprende/js/02_core.js` y `04_admin.js`):
- `startTimer()` ahora guarda `this.state.timerRemainingSeconds` en cada tick.
- Al reanudar de pausa, se usa ese valor local en vez del campo inexistente; si no hay segundos guardados (>0), simplemente no se reinicia el timer en vez de mostrar `NaN:NaN`.
- `handleServerState()` ahora lee `serverData.ranking_temporal` (el campo real) para poblar `this.state.ranking`.

Verificado en vivo contra SAM local: `GET /api/estado-juego?codigo=...&equipo=...` responde `ranking_temporal` y nunca `tiempo_restante` — confirma que el fix apunta al contrato real, no a una suposición.

## 5. Bloqueo real de despliegue: AWS Academy Learner Lab no permite `iam:CreateRole`

Al correr `sam deploy --guided` el stack `HelpiServerless` falló: CloudFormation no pudo crear `HealthFunctionRole` ni `CodeDeployServiceRole` (`iam:CreateRole` denegado explícitamente). El rol asumido (`assumed-role/voclabs/...`) confirma que es un **AWS Academy Learner Lab**: por diseño no deja crear roles IAM nuevos, solo reutilizar el rol `LabRole` ya provisionado por el laboratorio.

**Corrección** (`template.yaml`):
- Se agregó el parámetro `ExecutionRoleName` (default `LabRole`) — un solo lugar para cambiar el nombre del rol si la cuenta destino no es un Learner Lab, en vez de hardcodearlo disperso por el archivo (mismo criterio que `PROD_API_BASE_URL` en el frontend).
- Cada función y el `DeploymentPreference` (CodeDeploy) ahora usan `Role: !Sub 'arn:aws:iam::${AWS::AccountId}:role/${ExecutionRoleName}'` en vez de dejar que SAM genere un rol nuevo por recurso.
- Se quitó `Policies: [DynamoDBCrudPolicy...]` de la anchor `&GameFunction`: con `Role` explícito, SAM no gestiona el IAM del recurso, así que esa lista quedaba sin efecto.

**Verificado end-to-end en AWS real** (cuenta `695835257252`, stack `HelpiServerless`, `us-east-1`):
```
ApiUrl: https://t7twa8y9x6.execute-api.us-east-1.amazonaws.com/Prod
```
`GET /health` → 200. `POST /api/crear-sesion` → 200 con sesión creada en DynamoDB — confirma que `LabRole` sí tiene permisos de DynamoDB además de los de Lambda/API Gateway.

**Nota**: esa `ApiUrl` es del stack de este Learner Lab, que se resetea entre sesiones. A propósito **no se pegó** en `PROD_API_BASE_URL` de `00_env.js` — hacerlo habría repetido el problema de link hardcodeado ya señalado, y quedaría roto en la próxima sesión del lab. Para probar el frontend contra este deploy puntual, usar el mecanismo que ya existe sin tocar el archivo versionado:

```js
localStorage.setItem('misionEmprendeApiBaseUrl', 'https://t7twa8y9x6.execute-api.us-east-1.amazonaws.com/Prod')
```

## 6. Frontend desplegado en S3 (hosting estático)

Se creó `mision-emprende-frontend-695835257252` (S3, website hosting, lectura pública vía bucket policy — sin CloudFront, no requiere rol IAM nuevo). Se subió `frontend/` completo replicando las rutas limpias de Django: `profesor.html` y `panel-admin.html` se subieron como `profesor/index.html` y `panel-admin/index.html` (S3 website resuelve `<prefijo>/` a `<prefijo>/index.html`, igual que hace `serve.mjs` en local).

**Patrón aplicado — inyección de configuración en tiempo de despliegue, no en el código fuente**: `frontend/deploy-s3.sh` genera una copia temporal de `00_env.js` con `PROD_API_BASE_URL` reemplazado por el `ApiUrl` real, y sube *solo esa copia* al bucket. El `00_env.js` versionado en git sigue con el valor vacío. Esto evita repetir el problema original de link hardcodeado incluso en el caso de uso real de producción: el valor correcto vive en el artefacto desplegado, no en el repositorio.

Verificado en vivo: `http://mision-emprende-frontend-695835257252.s3-website-us-east-1.amazonaws.com/` (y `/profesor/`, `/panel-admin/`) responden 200, y la copia S3 de `00_env.js` contiene el `ApiUrl` real.

Nota: bucket y URL son de este Learner Lab y se pierden al resetear la cuenta; `frontend/deploy-s3.sh` es reproducible para recrearlo en cualquier cuenta nueva.
