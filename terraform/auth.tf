locals {
  frontend_url       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.frontend[0].domain_name}" : "https://${aws_api_gateway_rest_api.game.id}.execute-api.${var.primary_region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}"
  admin_callback_url = var.admin_callback_url != "" ? var.admin_callback_url : "${local.frontend_url}/panel-admin/index.html"
  cognito_domain     = var.cognito_domain_prefix != "" ? var.cognito_domain_prefix : "${local.name}-admin-${data.aws_caller_identity.current.account_id}"
}

resource "aws_cognito_user_pool" "admin" {
  name                     = "${local.name}-admins"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OPTIONAL"
  deletion_protection      = "ACTIVE"

  software_token_mfa_configuration { enabled = true }
  admin_create_user_config { allow_admin_create_user_only = true }
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }
}

resource "aws_cognito_user_pool_client" "admin" {
  name                                 = "${local.name}-admin-web"
  user_pool_id                         = aws_cognito_user_pool.admin.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "profile", "email"]
  callback_urls                        = [local.admin_callback_url]
  logout_urls                          = [local.admin_callback_url]
  supported_identity_providers         = ["COGNITO"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  access_token_validity                = 60
  id_token_validity                    = 60
  refresh_token_validity               = 1
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "admin" {
  domain       = local.cognito_domain
  user_pool_id = aws_cognito_user_pool.admin.id
}

resource "aws_cognito_user_group" "admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.admin.id
  description  = "Administradores autorizados de Mision Emprende"
}

# Pool aislado para la presentación del AWS Lab. Mantiene la credencial débil
# solicitada fuera del pool administrativo normal y puede eliminarse al acabar.
resource "aws_cognito_user_pool" "lab_demo" {
  name                = "${local.name}-lab-demo"
  deletion_protection = "INACTIVE"
  mfa_configuration   = "OFF"
  admin_create_user_config { allow_admin_create_user_only = true }
  lambda_config {
    create_auth_challenge          = aws_lambda_function.cognito_custom_auth.arn
    define_auth_challenge          = aws_lambda_function.cognito_custom_auth.arn
    verify_auth_challenge_response = aws_lambda_function.cognito_custom_auth.arn
  }
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 1
  }
}

resource "aws_cognito_user_pool_client" "lab_demo" {
  name                          = "${local.name}-lab-demo-web"
  user_pool_id                  = aws_cognito_user_pool.lab_demo.id
  generate_secret               = false
  explicit_auth_flows           = ["ALLOW_CUSTOM_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors = "ENABLED"
  access_token_validity         = 60
  id_token_validity             = 60
  refresh_token_validity        = 1
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_lambda_function" "cognito_custom_auth" {
  function_name    = "${local.name}-cognito-custom-auth"
  role             = data.aws_iam_role.execution.arn
  filename         = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256
  handler          = "functions/cognito-custom-auth/handler.handler"
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  memory_size      = 128
  timeout          = 5
  environment { variables = { DEMO_ADMIN_CODE = var.demo_admin_code } }
}

resource "aws_lambda_permission" "cognito_custom_auth" {
  statement_id   = "AllowCognitoCustomAuth"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.cognito_custom_auth.function_name
  principal      = "cognito-idp.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_cognito_user_group" "lab_demo_admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.lab_demo.id
  description  = "Administrador aislado para la demostración del AWS Lab"
}
