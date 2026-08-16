check "fis_configuration" {
  assert {
    condition = !var.enable_fis || (
      var.fis_experiment_role_arn != "" &&
      var.fis_stop_alarm_arn != "" &&
      var.fis_lambda_layer_arn != "" &&
      length(setsubtract(var.replica_regions, [var.primary_region])) > 0
    )
    error_message = "FIS requiere rol, alarma, layer Lambda y al menos una región réplica distinta."
  }
}

resource "aws_s3_bucket" "fis_configuration" {
  count         = var.enable_fis ? 1 : 0
  bucket        = "${local.name}-fis-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "fis_configuration" {
  count                   = var.enable_fis ? 1 : 0
  bucket                  = aws_s3_bucket.fis_configuration[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_fis_experiment_template" "finish_phase_latency" {
  count       = var.enable_fis ? 1 : 0
  description = "Añade 3 segundos al 25% de FinishPhase durante dos minutos"
  role_arn    = var.fis_experiment_role_arn
  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = var.fis_stop_alarm_arn
  }
  target {
    name           = "FinishPhase"
    resource_type  = "aws:lambda:function"
    resource_arns  = [aws_lambda_function.game["finish_phase"].arn]
    selection_mode = "COUNT(1)"
  }
  action {
    name      = "AddInvocationDelay"
    action_id = "aws:lambda:invocation-add-delay"
    parameter {
      key   = "duration"
      value = "PT2M"
    }
    parameter {
      key   = "invocationPercentage"
      value = "25"
    }
    parameter {
      key   = "startupDelayMilliseconds"
      value = "3000"
    }
    target {
      key   = "Functions"
      value = "FinishPhase"
    }
  }
  tags = { Experiment = "finish-phase-latency" }
}

resource "aws_fis_experiment_template" "finish_phase_errors" {
  count       = var.enable_fis ? 1 : 0
  description = "Devuelve errores controlados en el 10% de FinishPhase durante un minuto"
  role_arn    = var.fis_experiment_role_arn
  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = var.fis_stop_alarm_arn
  }
  target {
    name           = "FinishPhase"
    resource_type  = "aws:lambda:function"
    resource_arns  = [aws_lambda_function.game["finish_phase"].arn]
    selection_mode = "COUNT(1)"
  }
  action {
    name      = "InjectInvocationError"
    action_id = "aws:lambda:invocation-error"
    parameter {
      key   = "duration"
      value = "PT1M"
    }
    parameter {
      key   = "invocationPercentage"
      value = "10"
    }
    parameter {
      key   = "preventExecution"
      value = "true"
    }
    target {
      key   = "Functions"
      value = "FinishPhase"
    }
  }
  tags = { Experiment = "finish-phase-errors" }
}

resource "aws_fis_experiment_template" "dynamodb_replication_pause" {
  count       = var.enable_fis ? 1 : 0
  description = "Pausa cinco minutos la replicación de la tabla global DynamoDB"
  role_arn    = var.fis_experiment_role_arn
  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = var.fis_stop_alarm_arn
  }
  target {
    name           = "GlobalTable"
    resource_type  = "aws:dynamodb:global-table"
    resource_arns  = [aws_dynamodb_table.game.arn]
    selection_mode = "COUNT(1)"
  }
  action {
    name      = "PauseGlobalTableReplication"
    action_id = "aws:dynamodb:global-table-pause-replication"
    parameter {
      key   = "duration"
      value = "PT5M"
    }
    target {
      key   = "Tables"
      value = "GlobalTable"
    }
  }
  tags = { Experiment = "dynamodb-replication-pause" }
}
