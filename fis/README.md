# Experimentos FIS de FinishPhase

Este stack crea dos plantillas de AWS Fault Injection Service (FIS): latencia
del 25% y errores del 10%. No se ejecutan automáticamente ni deben desplegarse
en producción.

Las acciones `aws:lambda:function` requieren la extensión administrada de FIS
en la Lambda objetivo, un bucket S3 para su configuración y permisos de lectura
para la Lambda y escritura para el rol de experimento. Configura antes la
extensión con `AWS_FIS_CONFIGURATION_LOCATION` y
`AWS_LAMBDA_EXEC_WRAPPER=/opt/aws-fis/bootstrap` según la documentación de AWS.

El rol indicado en `FisExperimentRoleArn` debe tener como principal de confianza
`fis.amazonaws.com` y, para este experimento, permisos `lambda:GetFunction`,
`tag:GetResources`, `s3:PutObject` y `s3:DeleteObject` en el prefijo de
configuración FIS. `StopAlarmArn` es obligatorio: usa una alarma que detecte
errores o latencia anormal en el ambiente de pruebas. En AWS Academy normalmente es necesario pedir ese rol al
administrador, ya que Learner Lab no permite crear roles.

Ejemplo de despliegue en un ambiente de pruebas:

```bash
aws cloudformation deploy \
  --template-file fis/finish-phase-experiments.yaml \
  --stack-name mision-emprende-fis-dev \
  --parameter-overrides \
    FinishPhaseFunctionArn=<arn-de-la-lambda-dev> \
    FisExperimentRoleArn=<arn-del-rol-fis> \
    StopAlarmArn=<arn-de-alarma-cloudwatch>
```

Ejecuta una plantilla desde la consola de FIS y confirma que el frontend
reintenta la notificación de término sin duplicar el avance de fase.
