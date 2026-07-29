locals {
  name = "revora-${var.environment}"
  tags = {
    Application = "revora"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "random_password" "database" {
  length  = 40
  special = true
}
resource "aws_secretsmanager_secret" "database" {
  name = "${local.name}/database"
  tags = local.tags
}
resource "aws_secretsmanager_secret_version" "database" {
  secret_id     = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({ username = var.database_username, password = random_password.database.result })
}
resource "aws_kms_key" "data" {
  description             = "Revora data encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  tags                    = local.tags
}

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = var.private_subnet_ids
  tags       = local.tags
}
resource "aws_db_instance" "postgres" {
  identifier                  = "${local.name}-postgres"
  engine                      = "postgres"
  engine_version              = "16.4"
  instance_class              = "db.r6g.large"
  allocated_storage           = 100
  max_allocated_storage       = 1000
  storage_type                = "gp3"
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.data.arn
  db_name                     = var.database_name
  username                    = var.database_username
  password                    = random_password.database.result
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = var.database_security_group_ids
  backup_retention_period     = var.backup_retention_days
  copy_tags_to_snapshot       = true
  deletion_protection         = var.environment == "production"
  multi_az                    = var.environment == "production"
  performance_insights_enabled = true
  auto_minor_version_upgrade  = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${local.name}-final"
  tags                        = local.tags
}

resource "aws_elasticache_subnet_group" "main" {
  name       = local.name
  subnet_ids = var.private_subnet_ids
}
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name}-redis"
  description                = "Revora query cache"
  node_type                  = "cache.r7g.large"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = var.redis_security_group_ids
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled           = var.environment == "production"
  num_cache_clusters         = var.environment == "production" ? 2 : 1
  snapshot_retention_limit   = 7
  tags                       = local.tags
}

resource "aws_s3_bucket" "backups" {
  bucket = "${local.name}-backups-${data.aws_caller_identity.current.account_id}"
  tags   = local.tags
}
resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data.arn
    }
  }
}
resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/revora/${var.environment}/app"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.data.arn
  tags              = local.tags
}
resource "aws_ecs_cluster" "main" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = local.tags
}
resource "aws_iam_role" "execution" {
  name               = "${local.name}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
  tags               = local.tags
}
resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_ecs_task_definition" "app" {
  family                   = local.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.execution.arn
  container_definitions = jsonencode([{
    name                   = "app"
    image                  = var.container_image
    essential              = true
    readonlyRootFilesystem = true
    portMappings           = [{ containerPort = 3000 }]
    environment            = [{ name = "NODE_ENV", value = "production" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "app"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/observability/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
  tags = local.tags
}
resource "aws_ecs_service" "app" {
  name                               = local.name
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.app.arn
  desired_count                      = var.environment == "production" ? 3 : 1
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  enable_execute_command             = false
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.app_security_group_ids
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "app"
    container_port   = 3000
  }
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
  tags = local.tags
}

data "aws_caller_identity" "current" {}
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}
