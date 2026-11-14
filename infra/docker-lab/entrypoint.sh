#!/bin/bash
# entrypoint.sh — configura la llave SSH y arranca sshd
set -e

# Copiar la llave pública al usuario ansible si existe
if [ -f /lab-keys/id_ed25519.pub ]; then
    cp /lab-keys/id_ed25519.pub /home/ansible/.ssh/authorized_keys
    chmod 600 /home/ansible/.ssh/authorized_keys
    chown ansible:ansible /home/ansible/.ssh/authorized_keys
fi

# Crear directorio de run para sshd
mkdir -p /var/run/sshd

# Generar host keys si no existen
ssh-keygen -A

exec /usr/sbin/sshd -D
