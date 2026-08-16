variable "application_name" {
  type    = string
  default = "mision-emprende"
}
variable "environment" {
  type    = string
  default = "dev"
}
variable "primary_region" {
  type    = string
  default = "us-east-1"
}
variable "replica_regions" {
  description = "Regiones adicionales de la tabla global DynamoDB. sa-east-1 reduce latencia desde Chile."
  type        = set(string)
  default     = ["sa-east-1"]
}
variable "execution_role_name" {
  description = "Rol IAM existente para Lambda; LabRole funciona en AWS Academy."
  type        = string
  default     = "LabRole"
}
variable "game_table_name" {
  description = "Nombre físico. Fijarlo al nombre actual antes de importar una tabla creada por SAM."
  type        = string
  default     = ""
}
variable "frontend_bucket_name" {
  type    = string
  default = ""
}
variable "enable_cloudfront" {
  description = "Sirve el frontend con CloudFront. Desactívalo en AWS Academy y API Gateway lo servirá por HTTPS desde S3."
  type        = bool
  default     = true
}
variable "analytics_bucket_name" {
  type    = string
  default = ""
}
variable "force_destroy_buckets" {
  type    = bool
  default = false
}
variable "dynamodb_deletion_protection" {
  type    = bool
  default = true
}
variable "game_dynamodb_primary_region" {
  description = "Región preferida por el backend. Permite conmutar a una réplica para una demostración de failover."
  type        = string
  default     = ""
}
variable "game_dynamodb_primary_endpoint" {
  description = "Endpoint opcional para inyectar un fallo controlado en la conexión primaria durante una demostración."
  type        = string
  default     = ""
}
variable "demo_admin_code" {
  description = "Código del desafío Cognito del administrador demo. Dejar vacío fuera de presentaciones."
  type        = string
  sensitive   = true
  default     = ""
}
variable "log_retention_days" {
  type    = number
  default = 14
}
variable "admin_callback_url" {
  description = "Override opcional; vacío usa la URL HTTPS de CloudFront."
  type        = string
  default     = ""
}
variable "cognito_domain_prefix" {
  type    = string
  default = ""
}
variable "enable_fis" {
  type    = bool
  default = false
}
variable "fis_experiment_role_arn" {
  type      = string
  default   = ""
  sensitive = true
}
variable "fis_stop_alarm_arn" {
  type    = string
  default = ""
}
variable "fis_lambda_layer_arn" {
  description = "ARN regional de la extensión AWS FIS para Lambda arm64."
  type        = string
  default     = ""
}
