locals {
  cors_integration = {
    type             = "mock"
    contentHandling  = "CONVERT_TO_TEXT"
    requestTemplates = { "application/json" = "{\"statusCode\": 200}" }
    responses = {
      default = {
        statusCode      = "200"
        contentHandling = "CONVERT_TO_TEXT"
        responseParameters = {
          "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
          "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
          "method.response.header.Access-Control-Allow-Origin"  = "'*'"
        }
      }
    }
  }
  cors_options = {
    consumes = ["application/json"]
    produces = ["application/json"]
    responses = {
      "200" = {
        description = "CORS"
        headers = {
          "Access-Control-Allow-Headers" = { type = "string" }
          "Access-Control-Allow-Methods" = { type = "string" }
          "Access-Control-Allow-Origin"  = { type = "string" }
        }
      }
    }
    "x-amazon-apigateway-integration" = local.cors_integration
  }
  function_api_paths = {
    for key, route in local.functions : route.path => merge({
      (route.method) = merge({
        produces  = ["application/json"]
        responses = { "200" = { description = "Success" } }
        "x-amazon-apigateway-integration" = {
          type                = "aws_proxy"
          httpMethod          = "POST"
          passthroughBehavior = "when_no_match"
          uri                 = aws_lambda_function.game[key].invoke_arn
        }
      }, route.admin ? { security = [{ AdminCognitoAuthorizer = [] }] } : {})
    }, { options = local.cors_options })
  }
  api_paths = merge(local.function_api_paths, var.enable_cloudfront ? {} : {
    "/" = {
      get = {
        produces  = ["text/html"]
        responses = { "200" = { description = "Frontend" } }
        "x-amazon-apigateway-integration" = {
          type                = "aws_proxy"
          httpMethod          = "POST"
          passthroughBehavior = "when_no_match"
          uri                 = aws_lambda_function.game["frontend"].invoke_arn
        }
      }
      options = local.cors_options
    }
  })
}

resource "aws_api_gateway_rest_api" "game" {
  name        = "${local.name}-api"
  description = "API serverless de Mision Emprende"
  endpoint_configuration { types = ["REGIONAL"] }

  body = jsonencode({
    swagger = "2.0"
    info = {
      title   = "Mision Emprende"
      version = "1.0"
    }
    schemes = ["https"]
    paths   = local.api_paths
    # Keep only the assets that really need binary transport. Treating */* as
    # binary makes API Gateway try to decode empty CORS MOCK responses and
    # causes OPTIONS requests from the S3-hosted frontend to fail with 500.
    "x-amazon-apigateway-binary-media-types" = [
      "application/octet-stream",
      "font/woff",
      "font/woff2",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]
    securityDefinitions = {
      AdminCognitoAuthorizer = {
        type                           = "apiKey"
        name                           = "Authorization"
        in                             = "header"
        "x-amazon-apigateway-authtype" = "cognito_user_pools"
        "x-amazon-apigateway-authorizer" = {
          type         = "cognito_user_pools"
          providerARNs = [aws_cognito_user_pool.lab_demo.arn]
        }
      }
    }
  })
}

resource "aws_lambda_permission" "api" {
  for_each      = local.functions
  statement_id  = "AllowApiGateway-${replace(each.key, "_", "-")}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.game[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.game.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "game" {
  rest_api_id = aws_api_gateway_rest_api.game.id
  triggers    = { redeployment = sha1(jsonencode(aws_api_gateway_rest_api.game.body)) }
  depends_on  = [aws_lambda_permission.api]
  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id        = aws_api_gateway_deployment.game.id
  rest_api_id          = aws_api_gateway_rest_api.game.id
  stage_name           = "Prod"
  xray_tracing_enabled = true
}
