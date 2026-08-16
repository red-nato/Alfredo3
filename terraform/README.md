# Infraestructura Terraform

La configuración crea una arquitectura serverless completa:

- API Gateway REST y una Lambda Node.js 22 arm64 por operación.
- Cognito para administradores con Authorization Code + PKCE y grupo `Admins`.
- DynamoDB Global Table (MREC actual) con streams, PITR y réplica configurable.
- Frontend S3 privado servido por CloudFront HTTPS o, en modo AWS Academy,
  por una Lambda detrás del mismo API Gateway HTTPS.
- Eventos de interacción en DynamoDB para el dashboard y en S3 NDJSON
  particionado para Glue/Athena.
- Tres plantillas FIS opcionales: latencia Lambda, error Lambda y pausa de
  replicación DynamoDB.

## Requisitos

Terraform >= 1.7, AWS CLI autenticado, Node.js 22, Ansible y un rol IAM existente
que Lambda pueda asumir. El rol debe poder operar DynamoDB y escribir en el
bucket analítico; cuando `enable_fis=true`, también necesita leer la configuración
FIS. El rol de experimento FIS es distinto y debe ser asumible por
`fis.amazonaws.com`.

## Analítica

El panel calcula tiempo promedio/p50/p95, clics, completados, timeouts y uso de
ayuda por etapa. Para análisis histórico, consulta Athena con el workgroup y base
que imprimen los outputs. Ejemplo:

```sql
SELECT stage,
       count_if(event_type = 'click') AS clicks,
       avg(duration_ms) / 1000 AS avg_seconds,
       approx_percentile(duration_ms / 1000.0, 0.95) AS p95_seconds
FROM interaction_events
WHERE year = '2026' AND month = '08'
GROUP BY stage
ORDER BY stage;
```

FIS está deshabilitado por defecto. Actívalo solo en un ambiente de prueba con
una alarma de detención, el rol FIS y el ARN regional de la extensión Lambda.

AWS Academy puede limitar CloudFront y el acceso a regiones secundarias. Para
ese laboratorio usa `enable_cloudfront = false` y `replica_regions = []`. El
código de réplica multirregional permanece declarativo y puede activarse sin
cambios de arquitectura en una cuenta con permisos.
