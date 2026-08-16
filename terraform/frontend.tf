resource "aws_s3_bucket" "frontend" {
  bucket        = local.frontend_bucket_name
  force_destroy = var.force_destroy_buckets
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "${local.name}-frontend"
  description                       = "Acceso privado de CloudFront al frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "clean_urls" {
  count = var.enable_cloudfront ? 1 : 0

  name    = "${replace(local.name, "-", "_")}_clean_urls"
  runtime = "cloudfront-js-2.0"
  comment = "Resuelve /profesor/ y /panel-admin/ como index.html"
  publish = true
  code    = <<-JS
    function handler(event) {
      var request = event.request;
      if (request.uri.endsWith('/')) request.uri += 'index.html';
      return request;
    }
  JS
}

resource "aws_cloudfront_distribution" "frontend" {
  count = var.enable_cloudfront ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Frontend HTTPS de Mision Emprende"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend[0].id
  }

  default_cache_behavior {
    target_origin_id       = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.clean_urls[0].arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate { cloudfront_default_certificate = true }
}

data "aws_iam_policy_document" "frontend" {
  count = var.enable_cloudfront ? 1 : 0

  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  count      = var.enable_cloudfront ? 1 : 0
  bucket     = aws_s3_bucket.frontend.id
  policy     = data.aws_iam_policy_document.frontend[0].json
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}
