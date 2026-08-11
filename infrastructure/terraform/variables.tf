variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "environment" {
  type    = string
  default = "production"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production"
  }
}
variable "vpc_id" {
  type = string
}
variable "private_subnet_ids" {
  type = list(string)
}
variable "database_security_group_ids" {
  type = list(string)
}
variable "redis_security_group_ids" {
  type = list(string)
}
variable "app_security_group_ids" {
  type = list(string)
}
variable "target_group_arn" {
  type = string
}
variable "database_name" {
  type    = string
  default = "revora"
}
variable "database_username" {
  type    = string
  default = "revora"
}
variable "container_image" {
  type = string
}
variable "backup_retention_days" {
  type    = number
  default = 35
}
