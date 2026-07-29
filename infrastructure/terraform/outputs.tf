output "database_endpoint" {
  value     = aws_db_instance.postgres.address
  sensitive = true
}
output "redis_endpoint" {
  value     = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive = true
}
output "backup_bucket" {
  value = aws_s3_bucket.backups.id
}
output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}
output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}
