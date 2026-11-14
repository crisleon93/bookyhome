# main.tf — BookyHome infraestructura (OpenTofu)
# Describe la VM de servidor en un proveedor compatible con libvirt/Hetzner/DigitalOcean.
# Este archivo es un ejemplo con el proveedor de Hetzner Cloud.
#
# Uso:
#   tofu init
#   tofu plan
#   tofu apply
#   tofu destroy   # solo para entornos de prueba
#
# Variables sensibles: definir en terraform.tfvars (NO subir al repo).
# Ver terraform.tfvars.example para la plantilla.
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.6"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.47"
    }
  }
}

# ─── Proveedor ────────────────────────────────────────────────────────────────
provider "hcloud" {
  token = var.hcloud_token
}

# ─── Variables ────────────────────────────────────────────────────────────────
variable "hcloud_token" {
  description = "Token de API de Hetzner Cloud (sensible — no subir al repo)"
  type        = string
  sensitive   = true
}

variable "app_version" {
  description = "Versión de BookyHome a desplegar"
  type        = string
  default     = "1.0.1"
}

variable "server_name" {
  description = "Nombre del servidor en Hetzner"
  type        = string
  default     = "bookyhome-prod-01"
}

variable "server_type" {
  description = "Tipo de servidor (CPX11 = 2 vCPU / 2 GB RAM; CPX21 = 3 vCPU / 4 GB RAM)"
  type        = string
  default     = "cpx21"
  # Requisito mínimo del plan §1.5: 2 vCPU, 4 GB RAM
}

variable "location" {
  description = "Región de Hetzner (nbg1 = Nuremberg; hel1 = Helsinki)"
  type        = string
  default     = "nbg1"
}

variable "ssh_public_key_path" {
  description = "Ruta a la llave SSH pública del administrador"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

# ─── Llave SSH ────────────────────────────────────────────────────────────────
resource "hcloud_ssh_key" "ana" {
  name       = "ana-bookyhome"
  public_key = file(var.ssh_public_key_path)
}

# ─── Servidor ─────────────────────────────────────────────────────────────────
resource "hcloud_server" "bookyhome_prod" {
  name        = var.server_name
  server_type = var.server_type
  image       = "ubuntu-24.04"
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.ana.id]

  # cloud-init: preparación del primer arranque
  user_data = file("${path.module}/../cloud-init/user-data.yaml")

  labels = {
    project     = "bookyhome"
    environment = "production"
    version     = var.app_version
  }
}

# ─── IP flotante (opcional, para DNS estable) ─────────────────────────────────
resource "hcloud_floating_ip" "bookyhome" {
  type          = "ipv4"
  home_location = var.location
  description   = "IP pública estable de BookyHome"
}

resource "hcloud_floating_ip_assignment" "bookyhome" {
  floating_ip_id = hcloud_floating_ip.bookyhome.id
  server_id      = hcloud_server.bookyhome_prod.id
}

# ─── Salidas ──────────────────────────────────────────────────────────────────
output "server_ip" {
  description = "IP pública del servidor BookyHome"
  value       = hcloud_server.bookyhome_prod.ipv4_address
}

output "floating_ip" {
  description = "IP flotante (actualizar DNS con este valor)"
  value       = hcloud_floating_ip.bookyhome.ip_address
}

output "next_step" {
  description = "Siguiente paso tras crear el servidor"
  value       = <<-EOT
    Servidor creado. Próximos pasos:
    1. Actualizar infra/ansible/inventario.ini con la IP: ${hcloud_floating_ip.bookyhome.ip_address}
    2. Esperar a que cloud-init termine (~3 min)
    3. Ejecutar el playbook:
       ansible-playbook -i infra/ansible/inventario.ini \
                        infra/ansible/instalar-bookyhome.yml \
                        --ask-vault-pass
  EOT
}
