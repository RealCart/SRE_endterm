terraform {
  required_version = ">= 1.6.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

variable "environment" {
  default = "dev"
}

variable "vm_count" {
  default = 2
}

variable "vm_cpu" {
  default = 2
}

variable "vm_memory_mb" {
  default = 2048
}

resource "local_file" "inventory" {
  filename = "${path.module}/../ansible/inventory.ini"
  content = join("\n", concat(
    ["[sre_nodes]"],
    [for i in range(var.vm_count) : "sre-node-${i + 1} ansible_host=192.168.56.${10 + i} cpu=${var.vm_cpu} memory=${var.vm_memory_mb}"]
  ))
}

output "inventory_file" {
  value = local_file.inventory.filename
}

output "environment" {
  value = var.environment
}
