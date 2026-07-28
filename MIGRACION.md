# Migración y reglas de negocio

## Inventario migrado

| Contrato Django | Lambda | Caso de uso |
|---|---|---|
| `POST /api/crear-sesion/` | `CreateSessionFunction` | `createSession` |
| `POST /api/registrar-equipo/` | `RegisterTeamFunction` | `registerTeam` |
| `GET /api/obtener-equipos/{codigo}/` | `GetTeamsFunction` | `getTeams` |
| `POST /api/agregar-tokens/` | `AddTokensFunction` | `addTokens` |
| `GET /api/validar-sesion/` | `ValidateSessionFunction` | `validateSession` |
| `GET /api/estado-juego/` | `GameStateFunction` | `gameState` |
| `POST /api/equipo/terminar-fase/` | `FinishPhaseFunction` | `finishPhase` |
| `POST /api/admin/start|pause|next/` | tres Lambdas | control de sesión |
| `POST /api/equipo-listo/` | `TeamReadyFunction` | `teamReady` |
| `POST /api/terminar-pitch/` | `FinishPitchFunction` | `finishPitch` |
| `GET /api/admin-stats/` | `AdminStatsFunction` | `adminStats` |

## Reglas implementadas

1. El código de sesión tiene seis dígitos y se crea de manera condicional: no puede repetirse.
2. Una sesión comienza en `EN_ESPERA`, fase `0` y sin pausa.
3. El nombre de un equipo es único dentro de una sesión.
4. Un integrante sólo puede pertenecer a un equipo dentro de una sesión; registro de equipo e integrantes es una transacción DynamoDB.
5. Un equipo debe tener al menos un integrante válido.
6. Los tokens dejan un evento de auditoría y actualizan el puntaje en la misma transacción.
7. El inicio del profesor mueve la sesión a fase 1 y registra su hora de inicio una sola vez.
8. Al finalizar todos los equipos una fase, el juego avanza y se reinician sus banderas.
9. La fase 4 controla las subfases `prep`, `coins_intro` y `pitches`; el presentador se escoge entre equipos pendientes.
10. Una sesión que supera la fase 4 queda `FINALIZADA` y conserva su hora de cierre.

## Decisiones y trabajo pendiente antes de producción

- El legado no tiene autenticación; por lo tanto, los endpoints administrativos no deben exponerse públicamente. La siguiente mejora debe ser Cognito y autorización por rol `PROFESOR`/`ADMIN`.
- Las transiciones grupales actuales usan lectura y actualización. Para clases con muchas conexiones simultáneas, deben evolucionar a una transacción con atributo `version` y reintentos optimistas.
- Archivos de pitch no se guardan todavía: se implementarán con URL prefirmada de S3 y metadatos mínimos en el ítem del equipo.
- `admin/kick`, `admin/clear-all`, `admin/update-config`, `agrupar-alumnos`, `enviar-evaluaciones` y `admin-ranking` aparecen en JavaScript, pero no existen en `backend/api/urls.py`; no se deben inventar reglas para ellos. Deben validarse con el profesor/equipo antes de incorporarlos.
- La migración de datos SQLite no es necesaria para pruebas de juego. Si hay datos históricos que conservar, se exportarán a JSON y se importarán mediante un script idempotente separado; nunca mediante las Lambdas HTTP.
