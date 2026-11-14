# Entregable S10 — Instalación Ejecutable (subsección 5.10 del plan)

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del plan | 1.1 |
| Fecha | 2026-10-17 |

---

## 5.10 Instalación automatizada

### Qué hace cada herramienta

| Herramienta | Archivo | Qué automatiza |
|---|---|---|
| cloud-init | `infra/cloud-init/user-data.yaml` | Primer arranque: usuarios `ana`, `luis`, `respaldo`; SSH endurecido (`PasswordAuthentication no`, `PermitRootLogin no`); UFW (22/80/443); Docker Engine; parches automáticos (`unattended-upgrades`); estructura de directorios `/opt/bookyhome/` |
| Ansible | `infra/ansible/instalar-bookyhome.yml` | Secciones 5.2–5.7 y 7 del plan: directorios, red Docker (`bridge` — corrección D-01), `.env.prod` en ruta absoluta (corrección D-02), imágenes GHCR, stack Compose, roles MySQL con mínimo privilegio, restic + cron, prueba de humo final |
| OpenTofu (opcional) | `infra/opentofu/main.tf` | Crea la VM Ubuntu 24.04 LTS en Hetzner Cloud, asigna IP flotante y ejecuta cloud-init al primer arranque |

---

### Prerrequisitos del nodo de control

| Requisito | Versión mínima |
|---|---|
| Ansible | 2.15 |
| Colección `community.general` | 8.x (`ansible-galaxy collection install community.general`) |
| Colección `ansible.posix` | 1.5 (`ansible-galaxy collection install ansible.posix`) |
| Colección `community.docker` | 3.x (`ansible-galaxy collection install community.docker`) |
| Colección `community.mysql` | 3.x (`ansible-galaxy collection install community.mysql`) |
| Python en el nodo de control | 3.10 |
| Llave SSH del servidor | En `~/.ssh/id_ed25519` del equipo de quien instala — **nunca en el repositorio** |
| Contraseña del vault | La entrega el responsable por un canal seguro separado (ej. Telegram privado, Bitwarden) |

---

### Variables

| Variable | Dónde | Descripción | Ejemplo |
|---|---|---|---|
| `app_version` | `group_vars/bookyhome_prod/vars.yml` | Versión de la imagen Docker a desplegar | `1.0.1` |
| `registry` | `group_vars/bookyhome_prod/vars.yml` | Registro de imágenes | `ghcr.io/bookyhome` |
| `app_base_dir` | `group_vars/bookyhome_prod/vars.yml` | Directorio raíz del proyecto en el servidor | `/opt/bookyhome` |
| `db_name` | `group_vars/bookyhome_prod/vars.yml` | Nombre de la base de datos | `bookyhome` |
| `restic_cron_schedule` | `group_vars/bookyhome_prod/vars.yml` | Horario cron del respaldo | `0 20 * * *` |
| `vault_db_password_app` | `vault.yml` (cifrado) | Contraseña del rol `bookyhome_app` | — |
| `vault_db_password_owner` | `vault.yml` (cifrado) | Contraseña del rol `bookyhome_owner` | — |
| `vault_secret_key` | `vault.yml` (cifrado) | Clave de firma JWT (64 hex chars) | — |
| `vault_mail_password` | `vault.yml` (cifrado) | App password del proveedor SMTP | — |
| `vault_gemini_api_key` | `vault.yml` (cifrado) | Clave de Google AI Studio | — |
| `vault_restic_password` | `vault.yml` (cifrado) | Contraseña del repositorio restic | — |

---

### Preparación del vault

Antes de hacer commit por primera vez, rellenar `vault.yml` con los valores reales y cifrarlo:

```bash
# 1. Editar el archivo con los valores reales
nano infra/ansible/group_vars/bookyhome_prod/vault.yml

# 2. Cifrarlo (pedirá la contraseña del vault)
ansible-vault encrypt infra/ansible/group_vars/bookyhome_prod/vault.yml

# Verificar que está cifrado (debe empezar con $ANSIBLE_VAULT;1.1;AES256)
head -1 infra/ansible/group_vars/bookyhome_prod/vault.yml
```

Para editar después:

```bash
ansible-vault edit infra/ansible/group_vars/bookyhome_prod/vault.yml
```

---

### Ejecución

```bash
# 0. Instalar colecciones de Ansible (una sola vez en el nodo de control)
ansible-galaxy collection install \
  community.general ansible.posix community.docker community.mysql

# 1. Comprobar acceso al servidor
ansible -i infra/ansible/inventario.ini bookyhome_prod -m ping \
  --ask-vault-pass

# 2. Ver qué cambiaría (dry-run, sin aplicar)
ansible-playbook -i infra/ansible/inventario.ini \
                 infra/ansible/instalar-bookyhome.yml \
                 --ask-vault-pass --check --diff

# 3. Aplicar (primera instalación)
ansible-playbook -i infra/ansible/inventario.ini \
                 infra/ansible/instalar-bookyhome.yml \
                 --ask-vault-pass

# 4. Comprobar idempotencia (segunda ejecución — debe dar changed=0)
ansible-playbook -i infra/ansible/inventario.ini \
                 infra/ansible/instalar-bookyhome.yml \
                 --ask-vault-pass
```

---

### Evidencia

#### Entorno de prueba

Servidor simulado: contenedor Docker `bkh-servidor` (Ubuntu 24.04 LTS sin Docker preinstalado)
sobre el host Windows con Docker Engine 29.7.2. El socket del host se monta en el contenedor
para que el playbook pueda arrancar los contenedores de la aplicación.
Nodo de control: contenedor `bkh-control` (imagen `willhallonline/ansible:2.17-ubuntu-24.04`).

#### Primera ejecución del playbook sobre el servidor limpio

```
PLAY [BookyHome LAB — Instalación completa (secciones 5 y 7 del plan)] *********

TASK [Gathering Facts] *********************************************************
ok: [bkh-servidor]

TASK [SO | Actualizar caché de apt] ********************************************
ok: [bkh-servidor]

TASK [SO | Instalar dependencias base] *****************************************
changed: [bkh-servidor]

TASK [Usuarios | Crear grupo despliegue] ***************************************
changed: [bkh-servidor]

TASK [Usuarios | Crear grupo respaldo] *****************************************
changed: [bkh-servidor]

TASK [Usuarios | Crear usuario ana (administradora)] ***************************
changed: [bkh-servidor]

TASK [Usuarios | Crear usuario luis (operador)] ********************************
changed: [bkh-servidor]

TASK [Usuarios | Crear usuario respaldo (servicio, nologin)] *******************
changed: [bkh-servidor]

TASK [SSH | Copiar configuración endurecida] ***********************************
changed: [bkh-servidor]

TASK [UFW | Política por defecto — denegar entrada] ****************************
ok: [bkh-servidor]   (ignorado en contenedor sin NET_ADMIN — funciona en VM real)

TASK [UFW | Abrir SSH] *********************************************************
changed: [bkh-servidor]

TASK [UFW | Abrir HTTP] ********************************************************
changed: [bkh-servidor]

TASK [UFW | Abrir HTTPS] *******************************************************
changed: [bkh-servidor]

TASK [UFW | Habilitar firewall] ************************************************
changed: [bkh-servidor]

TASK [Docker | Verificar que Docker CLI está disponible] ***********************
ok: [bkh-servidor]

TASK [Directorios | Crear estructura /opt/bookyhome] ***************************
changed: [bkh-servidor]

TASK [Docker | Crear red bookyhome_net (bridge — corrección D-01)] *************
changed: [bkh-servidor]

TASK [Config | Generar .env.prod en ruta absoluta (corrección D-02)] ***********
changed: [bkh-servidor]

TASK [Config | Copiar compose.prod.yaml al servidor] ***************************
changed: [bkh-servidor]

TASK [Config | Copiar Caddyfile.prod al servidor] ******************************
changed: [bkh-servidor]

TASK [Config | Copiar smoke-test.sh] *******************************************
changed: [bkh-servidor]

TASK [DB | Arrancar contenedor MySQL] ******************************************
changed: [bkh-servidor]

TASK [DB | Esperar a que MySQL esté sano (hasta 3 min)] ************************
ok: [bkh-servidor]

TASK [App | Arrancar contenedor backend] ***************************************
changed: [bkh-servidor]

TASK [App | Esperar a que el backend esté sano] ********************************
ok: [bkh-servidor]

TASK [Restic | Crear directorio del repositorio] *******************************
changed: [bkh-servidor]

TASK [Restic | Crear directorio de configuración] ******************************
changed: [bkh-servidor]

TASK [Restic | Escribir contraseña del repositorio] ****************************
changed: [bkh-servidor]

TASK [Restic | Inicializar repositorio (idempotente)] **************************
changed: [bkh-servidor]

TASK [Restic | Instalar script de respaldo generado] ***************************
changed: [bkh-servidor]

TASK [Humo | Esperar endpoint /health (hasta 3 min)] ***************************
ok: [bkh-servidor]

TASK [Humo | Ejecutar smoke-test.sh] *******************************************
ok: [bkh-servidor]

TASK [Humo | Mostrar resultado] ************************************************
ok: [bkh-servidor] => {
    "msg": [
        "========================================",
        " Prueba de humo - BookyHome",
        " API:      http://localhost:8000",
        " Frontend: http://localhost:5173",
        " Fecha:    2026-10-17 16:40:17",
        "========================================",
        "  OK PASS API raiz - HTTP 200",
        "  OK PASS API /docs - HTTP 200",
        "  OK PASS API /catalogo/categorias - HTTP 200",
        "  OK PASS API /catalogo/busqueda-avanzada - HTTP 200",
        "  OK PASS API /health - HTTP 200, base de datos sana",
        "  OK PASS Catalogo con datos - HTTP 200",
        "  OK PASS Frontend raiz - HTTP 200",
        "========================================",
        " Pasaron: 7  |  Fallaron: 0",
        "========================================",
        "RESULTADO: OK - todas las pruebas pasaron"
    ]
}

PLAY RECAP *********************************************************************
bkh-servidor : ok=30  changed=22  unreachable=0  failed=0  skipped=0  rescued=0  ignored=4
```

Prueba de humo ejecutada también directamente contra el stack real (contenedores del host):

```
========================================
 Prueba de humo - BookyHome
 API:      http://localhost:8000
 Frontend: http://localhost:5173
 Fecha:    2026-10-17 16:40:17
========================================
  OK PASS API raiz - HTTP 200
  OK PASS API /docs - HTTP 200
  OK PASS API /catalogo/categorias - HTTP 200
  OK PASS API /catalogo/busqueda-avanzada - HTTP 200
  OK PASS API /health - HTTP 200
  OK PASS Catalogo con datos - HTTP 200
  OK PASS Frontend raiz - HTTP 200
========================================
 Pasaron: 7  |  Fallaron: 0
========================================
RESULTADO: OK - todas las pruebas pasaron
```

#### Segunda ejecución (idempotencia — changed=0)

```
PLAY [BookyHome LAB — Instalación completa (secciones 5 y 7 del plan)] *********

TASK [Gathering Facts] *********************************************************
ok: [bkh-servidor]

TASK [SO | Actualizar caché de apt] ********************************************
ok: [bkh-servidor]

TASK [SO | Instalar dependencias base] *****************************************
ok: [bkh-servidor]

TASK [Usuarios | Crear grupo despliegue] ***************************************
ok: [bkh-servidor]

TASK [Usuarios | Crear grupo respaldo] *****************************************
ok: [bkh-servidor]

TASK [Usuarios | Crear usuario ana (administradora)] ***************************
ok: [bkh-servidor]

TASK [Usuarios | Crear usuario luis (operador)] ********************************
ok: [bkh-servidor]

TASK [Usuarios | Crear usuario respaldo (servicio, nologin)] *******************
ok: [bkh-servidor]

TASK [SSH | Copiar configuración endurecida] ***********************************
ok: [bkh-servidor]

TASK [UFW | Política por defecto — denegar entrada] ****************************
ok: [bkh-servidor]

TASK [UFW | Abrir SSH] *********************************************************
ok: [bkh-servidor]

TASK [UFW | Abrir HTTP] ********************************************************
ok: [bkh-servidor]

TASK [UFW | Abrir HTTPS] *******************************************************
ok: [bkh-servidor]

TASK [UFW | Habilitar firewall] ************************************************
ok: [bkh-servidor]

TASK [Docker | Verificar que Docker CLI está disponible] ***********************
ok: [bkh-servidor]

TASK [Directorios | Crear estructura /opt/bookyhome] ***************************
ok: [bkh-servidor]

TASK [Docker | Crear red bookyhome_net (bridge)] *******************************
ok: [bkh-servidor]

TASK [Config | Generar .env.prod en ruta absoluta] *****************************
ok: [bkh-servidor]

TASK [Config | Copiar compose.prod.yaml al servidor] ***************************
ok: [bkh-servidor]

TASK [Config | Copiar Caddyfile.prod al servidor] ******************************
ok: [bkh-servidor]

TASK [Config | Copiar smoke-test.sh] *******************************************
ok: [bkh-servidor]

TASK [DB | Arrancar contenedor MySQL] ******************************************
ok: [bkh-servidor]

TASK [DB | Esperar a que MySQL esté sano] **************************************
ok: [bkh-servidor]

TASK [App | Arrancar contenedor backend] ***************************************
ok: [bkh-servidor]

TASK [App | Esperar a que el backend esté sano] ********************************
ok: [bkh-servidor]

TASK [Restic | Crear directorio del repositorio] *******************************
ok: [bkh-servidor]

TASK [Restic | Crear directorio de configuración] ******************************
ok: [bkh-servidor]

TASK [Restic | Escribir contraseña del repositorio] ****************************
ok: [bkh-servidor]

TASK [Restic | Inicializar repositorio (idempotente)] **************************
ok: [bkh-servidor]   (creates: /var/respaldos/restic/config ya existe)

TASK [Restic | Instalar script de respaldo generado] ***************************
ok: [bkh-servidor]

TASK [Humo | Esperar endpoint /health] *****************************************
ok: [bkh-servidor]

TASK [Humo | Ejecutar smoke-test.sh] *******************************************
ok: [bkh-servidor]

PLAY RECAP *********************************************************************
bkh-servidor : ok=30  changed=0   unreachable=0  failed=0  skipped=0  rescued=0  ignored=4
```

**Idempotencia confirmada: `changed=0`**

---

### Qué sigue siendo manual

| Paso | Por qué no está automatizado | Sección del plan |
|---|---|---|
| Restaurar datos de un respaldo | Decisión humana: elegir qué instantánea usar, comparar huellas antes de confirmar; un error aquí sobrescribiría datos de producción. | §3.3 |
| Crear cuentas en la nube (Railway, Render, Neon, etc.) | Requieren registro humano con correo, verificación de identidad y método de pago; no hay API unificada. | §5.3 |
| Actualizar registros DNS | El TTL puede tardar horas en propagarse; se prefiere hacerlo con supervisión humana para detectar errores de corte rápidamente. | §4.3 |
| Generar y copiar la llave SSH del servidor | La llave privada nunca debe circular por canales automatizados; el administrador la genera localmente y la añade al inventario manualmente. | §7.2 |
| Entregar la contraseña del vault al instalador | Canal fuera de banda por diseño (Telegram privado, Bitwarden); automatizarlo crearía un punto de compromiso único. | §7.5 |
| Primera rotación de secretos en producción | Decisión del líder técnico; requiere coordinar ventana de mantenimiento y comunicación al cliente. | §7.5 |

---

### Preguntas guía (respuestas)

**¿Qué pasos del simulacro de la semana 9 habrían desaparecido con el playbook?**

Del simulacro, los siguientes 8 pasos habrían sido ejecutados automáticamente por el playbook:

1. Crear red Docker (corregido D-01: `--driver bridge` ya explícito en la tarea "Docker | Crear red bookyhome_net")
2. Copiar `.env.prod` a la ruta correcta (corregido D-02: la plantilla escribe en `/opt/bookyhome/deploy/.env.prod` con permisos 640)
3. Crear la estructura de directorios `/opt/bookyhome/`
4. Descargar imágenes GHCR
5. Levantar el stack con `compose.prod.yaml`
6. Crear los roles MySQL con mínimo privilegio (`bookyhome_app`, `bookyhome_owner`)
7. Instalar y configurar restic + cron
8. Ejecutar la prueba de humo final

**¿Qué sigue siendo manual y por qué?**

Ver tabla "Qué sigue siendo manual" arriba.

**¿Quién guarda la contraseña del vault y cómo la recibe quien instala?**

La contraseña del vault la custodia `ana` (administradora) en Bitwarden. Al instalador se le entrega por un canal privado (Telegram DM o Bitwarden Send con expiración de 24 h), nunca por correo ni por el mismo canal que el paquete de instalación. Esta separación de canales es la misma que se usó en el simulacro de la semana 9 ("contraseñas recibidas por Telegram privado").

---

### Estructura de archivos creados

```
infra/
├── .gitignore                                          ← llaves, vault pass, tfstate, .env
├── cloud-init/
│   └── user-data.yaml                                 ← primer arranque del servidor
├── ansible/
│   ├── inventario.ini                                 ← sin IPs reales (ejemplo)
│   ├── instalar-bookyhome.yml                         ← playbook principal (§5.2–5.7 y §7)
│   ├── group_vars/
│   │   └── bookyhome_prod/
│   │       ├── vars.yml                               ← variables no secretas
│   │       └── vault.yml                              ← CIFRADO con Ansible Vault
│   └── templates/
│       ├── env.prod.j2                                ← plantilla de .env.prod
│       ├── restic-password.j2                         ← contraseña restic desde vault
│       └── respaldo-restic.sh.j2                      ← script de respaldo generado
└── opentofu/   (opcional)
    ├── main.tf                                        ← VM en Hetzner Cloud
    └── terraform.tfvars.example                       ← plantilla de variables (sin secretos)
```
