application_name             = "mision-emprende"
environment                  = "dev"
primary_region               = "us-east-1"
replica_regions              = ["us-west-2"]
execution_role_name          = "LabRole"
enable_cloudfront            = false
dynamodb_deletion_protection = true
force_destroy_buckets        = false

enable_fis              = false
fis_experiment_role_arn = ""
fis_stop_alarm_arn      = ""
fis_lambda_layer_arn    = ""
