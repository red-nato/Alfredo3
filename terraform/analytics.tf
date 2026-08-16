resource "aws_s3_bucket" "analytics" {
  bucket        = local.analytics_bucket_name
  force_destroy = var.force_destroy_buckets
}

resource "aws_s3_bucket_public_access_block" "analytics" {
  bucket                  = aws_s3_bucket.analytics.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  rule {
    id     = "analytics-retention"
    status = "Enabled"
    filter { prefix = "raw/" }
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    expiration { days = 730 }
  }
}

resource "aws_glue_catalog_database" "analytics" { name = replace("${local.name}-analytics", "-", "_") }

resource "aws_glue_catalog_table" "events" {
  name          = "interaction_events"
  database_name = aws_glue_catalog_database.analytics.name
  table_type    = "EXTERNAL_TABLE"
  parameters = {
    EXTERNAL                    = "TRUE"
    "projection.enabled"        = "true"
    "projection.year.type"      = "integer"
    "projection.year.range"     = "2025,2035"
    "projection.month.type"     = "integer"
    "projection.month.range"    = "1,12"
    "projection.month.digits"   = "2"
    "projection.day.type"       = "integer"
    "projection.day.range"      = "1,31"
    "projection.day.digits"     = "2"
    "projection.hour.type"      = "integer"
    "projection.hour.range"     = "0,23"
    "projection.hour.digits"    = "2"
    "storage.location.template" = "s3://${aws_s3_bucket.analytics.bucket}/raw/year=$${year}/month=$${month}/day=$${day}/hour=$${hour}/"
  }

  partition_keys {
    name = "year"
    type = "string"
  }
  partition_keys {
    name = "month"
    type = "string"
  }
  partition_keys {
    name = "day"
    type = "string"
  }
  partition_keys {
    name = "hour"
    type = "string"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics.bucket}/raw/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"
    ser_de_info { serialization_library = "org.openx.data.jsonserde.JsonSerDe" }
    columns {
      name = "event_id"
      type = "string"
    }
    columns {
      name = "event_type"
      type = "string"
    }
    columns {
      name = "session_code"
      type = "string"
    }
    columns {
      name = "team_name"
      type = "string"
    }
    columns {
      name = "stage"
      type = "int"
    }
    columns {
      name = "action"
      type = "string"
    }
    columns {
      name = "duration_ms"
      type = "bigint"
    }
    columns {
      name = "timed_out"
      type = "boolean"
    }
    columns {
      name = "client_timestamp"
      type = "string"
    }
    columns {
      name = "timestamp"
      type = "string"
    }
  }
}

resource "aws_athena_workgroup" "analytics" {
  name = "${local.name}-analytics"
  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true
    result_configuration {
      output_location = "s3://${aws_s3_bucket.analytics.bucket}/athena-results/"
      encryption_configuration { encryption_option = "SSE_S3" }
    }
  }
}
