data "archive_file" "backend" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/backend.zip"
  excludes    = ["test", "scripts", ".DS_Store"]
}

resource "aws_dynamodb_table" "game" {
  name         = local.game_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  stream_enabled              = true
  stream_view_type            = "NEW_AND_OLD_IMAGES"
  deletion_protection_enabled = var.dynamodb_deletion_protection

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "S"
  }
  attribute {
    name = "GSI2PK"
    type = "S"
  }
  attribute {
    name = "GSI2SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    projection_type = "ALL"
    key_schema {
      attribute_name = "GSI1PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI1SK"
      key_type       = "RANGE"
    }
  }
  global_secondary_index {
    name            = "GSI2"
    projection_type = "ALL"
    key_schema {
      attribute_name = "GSI2PK"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "GSI2SK"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  dynamic "replica" {
    for_each = setsubtract(var.replica_regions, [var.primary_region])
    content {
      region_name            = replica.value
      point_in_time_recovery = true
      propagate_tags         = true
    }
  }

  tags = { DisruptDynamoDb = "Allowed" }
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = local.functions
  name              = "/aws/lambda/${local.name}-${replace(each.key, "_", "-")}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "game" {
  for_each         = local.functions
  function_name    = "${local.name}-${replace(each.key, "_", "-")}"
  description      = "Mision Emprende: ${each.key}"
  role             = data.aws_iam_role.execution.arn
  filename         = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256
  handler          = each.value.handler
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  memory_size      = 128
  timeout          = each.key == "admin_stats" ? 30 : 10
  publish          = true

  layers = var.enable_fis && each.key == "finish_phase" ? [var.fis_lambda_layer_arn] : []

  environment {
    variables = merge({
      GAME_TABLE_NAME                = aws_dynamodb_table.game.name
      GAME_DYNAMODB_PRIMARY_REGION   = var.game_dynamodb_primary_region != "" ? var.game_dynamodb_primary_region : var.primary_region
      GAME_DYNAMODB_PRIMARY_ENDPOINT = var.game_dynamodb_primary_endpoint
      GAME_DYNAMODB_FAILOVER_REGIONS = join(",", sort(tolist(setsubtract(var.replica_regions, [var.primary_region]))))
      DYNAMODB_ENDPOINT              = ""
      ANALYTICS_BUCKET_NAME          = aws_s3_bucket.analytics.bucket
      FRONTEND_BUCKET_NAME           = aws_s3_bucket.frontend.bucket
      ADMIN_USER_POOL_ID             = aws_cognito_user_pool.lab_demo.id
      }, var.enable_fis && each.key == "finish_phase" ? {
      AWS_LAMBDA_EXEC_WRAPPER        = "/opt/aws-fis/bootstrap"
      AWS_FIS_CONFIGURATION_LOCATION = "arn:${data.aws_partition.current.partition}:s3:::${aws_s3_bucket.fis_configuration[0].bucket}/fis/"
    } : {})
  }

  tracing_config { mode = "Active" }
  depends_on = [aws_cloudwatch_log_group.lambda]
}
