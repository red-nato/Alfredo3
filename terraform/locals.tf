locals {
  name = "${var.application_name}-${var.environment}"
  common_tags = {
    Application = var.application_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  game_table_name       = var.game_table_name != "" ? var.game_table_name : "${local.name}-game"
  frontend_bucket_name  = var.frontend_bucket_name != "" ? var.frontend_bucket_name : "${local.name}-frontend-${data.aws_caller_identity.current.account_id}"
  analytics_bucket_name = var.analytics_bucket_name != "" ? var.analytics_bucket_name : "${local.name}-analytics-${data.aws_caller_identity.current.account_id}"

  functions = merge({
    health            = { handler = "functions/health/handler.handler", path = "/health", method = "get", admin = false }
    create_session    = { handler = "functions/create-session/handler.handler", path = "/api/crear-sesion", method = "post", admin = false }
    register_team     = { handler = "functions/register-team/handler.handler", path = "/api/registrar-equipo", method = "post", admin = false }
    get_teams         = { handler = "functions/get-teams/handler.handler", path = "/api/obtener-equipos/{codigo}", method = "get", admin = false }
    add_tokens        = { handler = "functions/add-tokens/handler.handler", path = "/api/agregar-tokens", method = "post", admin = false }
    validate          = { handler = "functions/validate-session/handler.handler", path = "/api/validar-sesion", method = "get", admin = false }
    game_state        = { handler = "functions/game-state/handler.handler", path = "/api/estado-juego", method = "get", admin = false }
    finish_phase      = { handler = "functions/finish-phase/handler.handler", path = "/api/equipo/terminar-fase", method = "post", admin = false }
    team_ready        = { handler = "functions/team-ready/handler.handler", path = "/api/equipo-listo", method = "post", admin = false }
    finish_pitch      = { handler = "functions/finish-pitch/handler.handler", path = "/api/terminar-pitch", method = "post", admin = false }
    analytics         = { handler = "functions/analytics-events/handler.handler", path = "/api/analytics/events", method = "post", admin = false }
    admin_start       = { handler = "functions/admin-start/handler.handler", path = "/api/admin/start", method = "post", admin = true }
    admin_pause       = { handler = "functions/admin-pause/handler.handler", path = "/api/admin/pause", method = "post", admin = true }
    admin_next        = { handler = "functions/admin-next/handler.handler", path = "/api/admin/next", method = "post", admin = true }
    admin_stats       = { handler = "functions/admin-stats/handler.handler", path = "/api/admin-stats", method = "get", admin = true }
    admin_create_user = { handler = "functions/admin-create-user/handler.handler", path = "/api/admin/users", method = "post", admin = true }
    }, var.enable_cloudfront ? {} : {
    frontend = { handler = "functions/frontend/handler.handler", path = "/{proxy+}", method = "get", admin = false }
  })
}
