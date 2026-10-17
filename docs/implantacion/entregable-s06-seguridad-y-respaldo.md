# Entregable S06 — Seguridad, Usuarios y Plan de Respaldo Final

| Campo | Valor |
|---|---|
| Proyecto | BookyHome |
| Equipo | Equipo BookyHome |
| Versión del software | 1.0.0 |
| Fecha | 2026-10-17 |

---

## 7.1 Usuarios del sistema operativo

| Cuenta | Tipo | Persona o servicio | Grupos | Inicia sesión | sudo permitido |
|---|---|---|---|---|---|
| `ana` | Persona | Administradora | `sudo`, `despliegue` | Llave SSH | Todo, con contraseña |
| `luis` | Persona | Operador | `despliegue` | Llave SSH | `/usr/local/bin/reiniciar-bookyhome` |
| `respaldo` | Servicio | cron + restic | `respaldo` | No (`/usr/sbin/nologin`) | Nada |

### Archivos y carpetas sensibles

| Ruta | Dueño:grupo | Permisos | Por qué |
|---|---|---|---|
| `/opt/bookyhome` | `root:despliegue` | `2770` | Solo el equipo de despliegue entra; el bit setgid hereda el grupo |
| `/opt/bookyhome/deploy/.env.prod` | `root:despliegue` | `640` | Secretos de la app; el grupo despliegue lee, el resto no |
| `/opt/bookyhome/deploy/compose.prod.yaml` | `root:despliegue` | `660` | Configuración de orquestación; el grupo puede editar |
| `/opt/bookyhome/scripts/` | `root:despliegue` | `2750` | Scripts de respaldo y despliegue; el grupo ejecuta |
| `/etc/restic/password` | `root:respaldo` | `640` | Contraseña del repositorio restic; solo root y el servicio de respaldo |
| `/var/respaldos/restic/` | `root:respaldo` | `2770` | Repositorio restic local; el servicio de respaldo escribe |
| `/var/log/restic-bookyhome.log` | `root:respaldo` | `660` | Log de respaldos; auditable por el grupo respaldo |
| `/etc/ssh/sshd_config.d/10-endurecer.conf` | `root:root` | `644` | Endurecimiento SSH |
| `/etc/sudoers.d/luis` | `root:root` | `440` | sudo limitado del operador |

### Procedimiento de creación de cuentas

```bash
# Crear grupos
sudo groupadd despliegue
sudo groupadd respaldo

# Crear administradora
sudo useradd -m -s /bin/bash -G sudo,despliegue ana

# Crear operador
sudo useradd -m -s /bin/bash -G despliegue luis

# Crear servicio de respaldo (sin shell)
sudo useradd -r -s /usr/sbin/nologin -G respaldo respaldo

# Instalar llaves SSH públicas de cada persona
sudo mkdir -p /home/ana/.ssh /home/luis/.ssh
echo "ssh-ed25519 AAAA... ana@bookyhome" | sudo tee /home/ana/.ssh/authorized_keys
echo "ssh-ed25519 AAAA... luis@bookyhome" | sudo tee /home/luis/.ssh/authorized_keys
sudo chown -R ana:ana /home/ana/.ssh
sudo chown -R luis:luis /home/luis/.ssh
sudo chmod 700 /home/ana/.ssh /home/luis/.ssh
sudo chmod 600 /home/ana/.ssh/authorized_keys /home/luis/.ssh/authorized_keys
```

### sudo limitado del operador

Archivo `/etc/sudoers.d/luis` (permisos `440`):

```text
# El operador luis solo puede reiniciar el stack de BookyHome
luis ALL=(root) NOPASSWD: /usr/local/bin/reiniciar-bookyhome
```

Script `/usr/local/bin/reiniciar-bookyhome` (permisos `755`, dueño `root:root`):

```bash
#!/usr/bin/env bash
# Reinicia el stack de BookyHome con Docker Compose
cd /opt/bookyhome
docker compose -f deploy/compose.prod.yaml restart
```

**Prueba negativa — el operador no puede hacer otra cosa con sudo:**

```text
$ sudo apt update
[sudo] password for luis:
Sorry, user luis is not allowed to execute '/usr/bin/apt update' as root on bookyhome-server.

$ sudo /usr/local/bin/reiniciar-bookyhome
Restarting bookyhome-mysql  ... done
Restarting bookyhome-backend ... done
Restarting bookyhome-caddy  ... done
```

---

## 7.2 Acceso remoto y firewall

### Endurecimiento de SSH

Archivo `/etc/ssh/sshd_config.d/10-endurecer.conf`:

```text
# ─── Endurecimiento SSH — BookyHome ──────────────────────────────────────────
# Solo autenticación con llave, sin contraseñas
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no

# Sin root directo
PermitRootLogin no

# Quiénes pueden entrar
AllowUsers ana luis

# Tiempo de espera y reintentos
LoginGraceTime 30
MaxAuthTries 3

# Sin reenvío de X11 ni agente (servidor sin GUI)
X11Forwarding no
AllowAgentForwarding no

# Banner legal
Banner /etc/ssh/banner-bookyhome
```

Aplicar cambios:

```bash
sudo sshd -t                          # validar sintaxis
sudo systemctl restart ssh             # aplicar
```

### Firewall UFW

```bash
# Política por defecto: negar todo lo entrante
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Puertos abiertos explícitamente
sudo ufw allow 22/tcp    comment 'SSH administración'
sudo ufw allow 80/tcp    comment 'HTTP Caddy'
sudo ufw allow 443/tcp   comment 'HTTPS Caddy'

# Activar firewall
sudo ufw enable
```

### Estado del firewall (`sudo ufw status verbose`)

```text
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere                   # SSH administración
80/tcp                     ALLOW IN    Anywhere                   # HTTP Caddy
443/tcp                    ALLOW IN    Anywhere                   # HTTPS Caddy
22/tcp (v6)                ALLOW IN    Anywhere (v6)
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
```

### Puertos abiertos y justificación

| Puerto | Abierto | Justificación |
|---|---|---|
| 22/tcp | Sí | SSH para administración, solo con llave (PasswordAuthentication no) |
| 80/tcp | Sí | HTTP → redirección a HTTPS (Caddy + Let's Encrypt ACME) |
| 443/tcp | Sí | HTTPS → frontend y API detrás de Caddy (TLS automático) |
| 3306/tcp | **No** | MySQL solo accesible en la red interna de Docker (`bookyhome_net`) |
| 8000/tcp | **No** | API FastAPI detrás de Caddy, no expuesta al host |
| 5173/tcp | **No** | Vite dev server no existe en producción (build estático) |

### Evidencia de que la base de datos no está expuesta

```text
$ docker compose -f /opt/bookyhome/deploy/compose.prod.yaml ps
NAME                   STATUS               PORTS
bookyhome-mysql        Up (healthy)         3306/tcp   ← sin mapeo al host
bookyhome-backend      Up (healthy)         8000/tcp   ← sin mapeo al host
bookyhome-frontend     Up                   80/tcp     ← sin mapeo al host
bookyhome-caddy        Up                   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

La columna `PORTS` de `bookyhome-mysql` muestra `3306/tcp` **sin prefijo `0.0.0.0:`**, lo que confirma que el puerto no está publicado al host; solo es accesible dentro de la red Docker `bookyhome_net`.

Prueba desde otro equipo (simulada en laboratorio):

```text
$ nc -zv 192.168.1.50 3306 2>&1
nc: connect to 192.168.1.50 port 3306 (tcp) failed: Connection refused

$ nc -zv 192.168.1.50 8000 2>&1
nc: connect to 192.168.1.50 port 8000 (tcp) failed: Connection refused

$ nc -zv 192.168.1.50 443 2>&1
Connection to 192.168.1.50 443 port [tcp/*] succeeded!
```

Solo el puerto 443 (Caddy) responde desde fuera. Los puertos 3306 (MySQL) y 8000 (API) no aceptan conexiones externas.

---

## 7.3 Roles de la base de datos

BookyHome usa MySQL 8. Los roles se crean con `CREATE USER` + `GRANT` porque MySQL no tiene el concepto de roles separados de usuarios como PostgreSQL; el efecto es equivalente: cada rol es un usuario con un conjunto fijo de privilegios.

| Rol | Privilegios | No puede | Lo usa | Dónde vive su contraseña |
|---|---|---|---|---|
| `bookyhome_owner` | `ALL PRIVILEGES ON bookyhome.*` (incluye CREATE, ALTER, DROP, INDEX) | Crear usuarios ni bases de datos (sin privilegios globales) | Migraciones (`database/migrations/*.sql`) | Gestor de contraseñas (Bitwarden) |
| `bookyhome_app` | `SELECT, INSERT, UPDATE, DELETE ON bookyhome.*` | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `INDEX`, `REFERENCES`, `GRANT OPTION` | La app (backend FastAPI, `.env.prod`) | `/opt/bookyhome/deploy/.env.prod` (permisos 600) |

Enlace al script de roles en el repositorio: [`scripts/crear-roles-bd.sh`](../../scripts/crear-roles-bd.sh)

El script no contiene contraseñas reales: las genera con `openssl rand -base64 24` si no se pasan por variables de entorno, y las muestra una sola vez para anotarlas en el gestor de contraseñas.

### ¿Cómo se aplican las migraciones con el rol dueño en tu despliegue?

1. El operador (`luis`) se conecta al servidor por SSH con su llave.
2. Ejecuta las migraciones con el rol `bookyhome_owner` (no con `root` ni con `bookyhome_app`):

```bash
# En el servidor, desde /opt/bookyhome
export DB_MIGRATION_PASSWORD=$(cat /opt/bookyhome/deploy/.env.prod | grep DB_MIGRATION_PASSWORD | cut -d= -f2)

for f in database/migrations/*.sql; do
  echo "Aplicando: $f"
  docker exec -i bookyhome-mysql \
    mysql -u bookyhome_owner -p"$DB_MIGRATION_PASSWORD" bookyhome \
    < "$f"
done
```

3. La aplicación (backend FastAPI) se conecta siempre con `bookyhome_app`, que no tiene privilegios DDL. Si alguien encuentra una inyección SQL en la API, el peor caso es manipular o borrar filas de tablas existentes; no puede crear, alterar ni borrar tablas, ni escalar a otras bases de datos.

4. El rol `root` de MySQL solo se usa para la creación inicial de la base, los roles y emergencias. La contraseña de root no está en `.env.prod` ni en el repositorio.

---

## 7.4 Pruebas de privilegios

| Rol | Operación | Esperado | Obtenido |
|---|---|---|---|
| `bookyhome_app` | `DROP TABLE usuarios` | Error: sin permiso | `ERROR 1142 (42000): DROP command denied to user 'bookyhome_app'@'%' for table 'usuarios'` |
| `bookyhome_app` | `CREATE TABLE hack (id INT)` | Error: sin permiso | `ERROR 1142 (42000): CREATE command denied to user 'bookyhome_app'@'%' for database 'bookyhome'` |
| `bookyhome_app` | `ALTER TABLE libros ADD COLUMN x INT` | Error: sin permiso | `ERROR 1142 (42000): ALTER command denied to user 'bookyhome_app'@'%' for table 'libros'` |
| `bookyhome_app` | `TRUNCATE TABLE usuarios` | Error: sin permiso | `ERROR 1142 (42000): DROP command denied to user 'bookyhome_app'@'%' for table 'usuarios'` |
| `bookyhome_app` | `SELECT * FROM usuarios` | Datos visibles | 285 filas devueltas ✅ |
| `bookyhome_app` | `INSERT INTO tiendas (...) VALUES (...)` | Fila insertada | 1 fila afectada ✅ |
| `bookyhome_app` | `GRANT SELECT ON bookyhome.* TO 'otro'@'%'` | Error: sin permiso | `ERROR 1044 (42000): Access denied for user 'bookyhome_app'@'%' to database 'bookyhome'` |
| `bookyhome_owner` | `CREATE TABLE prueba_permisos (id INT)` | Tabla creada | Query OK, 0 rows affected ✅ |
| `bookyhome_owner` | `DROP TABLE prueba_permisos` | Tabla eliminada | Query OK, 0 rows affected ✅ |
| `bookyhome_owner` | `CREATE USER 'intruso'@'%' IDENTIFIED BY 'x'` | Error: sin permiso global | `ERROR 1227 (42000): Access denied; you need (at least one of) the CREATE USER privilege(s) for this operation` |
| `respaldo` | `docker exec bookyhome-mysql mysqldump ...` | Volcado generado | 174 MB generados ✅ |

---

## 7.5 Inventario de secretos

| Secreto | Da acceso a | Dónde vive (cada ambiente) | Permisos | Quién lo lee | Cómo se rota |
|---|---|---|---|---|---|
| `DB_PASSWORD` (rol app) | Base de datos (lectura/escritura de datos) | **Dev:** `backend/.env` (no en repo) · **Servidor:** `/opt/bookyhome/deploy/.env.prod` · **Nube:** panel de Railway (secreto) | 600 en servidor | `bookyhome-backend`, operador | `scripts/crear-roles-bd.sh` (generar nueva) → actualizar `.env.prod` → reiniciar backend |
| `DB_MIGRATION_PASSWORD` (rol owner) | Base de datos (DDL completo) | **Servidor:** gestor de contraseñas (Bitwarden) + `.env.prod` (referencia) · **Dev:** no se usa | 600 en `.env.prod` | Operador (migraciones) | `scripts/crear-roles-bd.sh` con nueva contraseña → ejecutar en MySQL → actualizar gestor |
| `SECRET_KEY` | Firma tokens JWT | **Dev:** `backend/.env` · **Servidor:** `.env.prod` (600) · **Nube:** panel de Render | 600 | `bookyhome-backend` | Generar nueva: `python3 -c "import secrets; print(secrets.token_hex(32))"` → actualizar `.env.prod` → reiniciar (invalida sesiones activas) |
| `MAIL_PASSWORD` | Envío de correo SMTP | **Dev:** `backend/.env` · **Servidor:** `.env.prod` (600) · **Nube:** panel de Render | 600 | `bookyhome-backend` | Generar app password en el proveedor → actualizar `.env.prod` → reiniciar |
| `GEMINI_API_KEY` | API de Gemini (asistente IA) | **Dev:** `backend/.env` · **Servidor:** `.env.prod` (600) · **Nube:** panel de Render | 600 | `bookyhome-backend` | Revocar clave en Google AI Studio → crear nueva → actualizar `.env.prod` → reiniciar |
| Contraseña de restic | Todos los respaldos cifrados | **Servidor:** `/etc/restic/password` (640) + copia en gestor de contraseñas (Bitwarden, fuera del servidor) | 640 en servidor | `respaldo` (servicio), administradores | `restic key add` con nueva contraseña → `restic key remove` la antigua → actualizar `/etc/restic/password` + gestor |
| Contraseña root MySQL | Administración total de la BD | **Servidor:** variable `MYSQL_ROOT_PASSWORD` en `.env.prod` (600) + gestor de contraseñas | 600 | `ana` (admin), `root` del contenedor | Cambiar en `.env.prod` + `docker compose` con nueva contraseña → recrear contenedor |
| Llaves SSH (ana, luis) | Acceso SSH al servidor | **Cliente:** `~/.ssh/id_ed25519` (600) · **Servidor:** `~/.ssh/authorized_keys` (600) | 600 | `ana`, `luis` | Generar nueva llave: `ssh-keygen -t ed25519` → añadir a `authorized_keys` → eliminar la antigua |

### Revisión del historial del repositorio

Comando usado para buscar secretos en el historial de Git:

```bash
# Buscar archivos .env que se hayan commiteado alguna vez
git log --all --oneline --diff-filter=A -- ".env" "backend/.env" "deploy/.env.prod"

# Buscar contraseñas o API keys reales en el historial
git log --all -p -S "GEMINI_API_KEY=AIza" --oneline
git log --all -p -S "MYSQL_ROOT_PASSWORD=" -- "*.yaml" "*.yml" "*.py" "*.sh" --oneline
git log --all -p -S "DB_PASSWORD=root" -- "*.yaml" "*.yml" --oneline
git log --all -p -S "SECRET_KEY=tu_clave" -- "*.py" "*.yaml" --oneline

# Buscar IPs internas o credenciales en el código
git log --all -p -S "password" -- "*.env" --oneline
```

Resultado:

```text
$ git log --all --oneline --diff-filter=A -- ".env" "backend/.env" "deploy/.env.prod"
(empty — ningún .env se ha commiteado)

$ git log --all -p -S "GEMINI_API_KEY=AIza" --oneline
(empty — no hay claves reales de Gemini en el historial)

$ git log --all -p -S "MYSQL_ROOT_PASSWORD=" --oneline
1f97eec3 docs(implantacion): agrega entregable semana 04 - procedimiento de despliegue v1
  → Referencia a ${DB_PASSWORD} (variable, no valor real) en compose.prod.yaml

$ git log --all -p -S "DB_PASSWORD=root" -- "*.yaml" --oneline
(empty — compose.prod.yaml usa ${DB_PASSWORD}, no valor literal)

$ git log --all -p -S "password" -- "*.env" --oneline
(empty — archivos .env nunca en el repo)
```

**Conclusión:** no se encontraron secretos reales en el historial del repositorio. Los archivos `.env` están en `.gitignore` desde el primer commit. El `docker-compose.yml` de desarrollo contiene `MYSQL_ROOT_PASSWORD: root` (contraseña de desarrollo), pero nunca se ha commiteado un `.env` con una contraseña real de producción.

**Acción tomada:** el `docker-compose.yml` de desarrollo usa `MYSQL_ROOT_PASSWORD: root`. Esto es acceptable para desarrollo local pero se documenta aquí como una observación: la contraseña `root` en desarrollo no es un secreto de producción y no está en ningún archivo `.env` versionado. No requiere rotación.

### Respuestas a las preguntas guía

**1. Si mañana se va una persona del equipo, ¿qué cuentas, llaves y secretos hay que cambiar?**

- Eliminar la llave SSH pública de esa persona de `~/.ssh/authorized_keys` en el servidor.
- Si era `ana` (admin): revisar y rotar `SECRET_KEY`, contraseña root de MySQL y contraseña de restic, porque tenía acceso a `.env.prod` y al gestor de contraseñas.
- Si era `luis` (operador): eliminar su entrada en `/etc/sudoers.d/luis`; rotar `DB_MIGRATION_PASSWORD` porque tenía acceso al rol owner.
- Revocar su acceso al gestor de contraseñas (Bitwarden) y a los paneles de Render/Railway.
- Verificar que no quedan llaves SSH autorizadas en el servidor con `cat /home/<usuario>/.ssh/authorized_keys`.

**2. ¿Qué puede hacer tu app en la base si alguien encuentra una inyección SQL?**

El backend se conecta con `bookyhome_app`, que solo tiene `SELECT, INSERT, UPDATE, DELETE`. Un atacante con inyección SQL puede:
- Leer, insertar, modificar o borrar filas de tablas existentes.
- **No** puede: crear tablas, alterar estructura, borrar tablas, crear índices, crear usuarios, acceder a otras bases de datos ni conceder permisos.
- El daño se limita a los datos, no a la estructura. La recuperación es posible desde el respaldo más reciente (RPO 24 h).

**3. ¿Dónde está la contraseña de restic si el servidor desaparece?**

La contraseña de restic vive en dos lugares:
1. `/etc/restic/password` en el servidor (permisos 640, `root:respaldo`).
2. Una copia en el gestor de contraseñas del equipo (Bitwarden), que está fuera del servidor.

Si el servidor desaparece, la copia en Bitwarden permite acceder al repositorio restic remoto (SFTP al NAS de la librería) para restaurar. Sin esa copia, los respaldos cifrados serían irrecuperables.

**4. ¿Tu restauración de desastre cumple el RTO que acordaste en la semana 2?**

Sí. El RTO acordado es 2 horas (7200 segundos). La restauración de desastre probada tomó 4 minutos y 12 segundos (252 s), incluyendo la descarga desde el repositorio remoto y la verificación de huellas. Esto deja un margen amplio para imprevistos. Ver §3.4 para el registro medido.

---

## 3. Plan de respaldo final (reemplaza la versión de la semana 2)

> Este plan reemplaza al plan v0 de [`docs/implantacion/entregable-s02-planes.md § 3`](entregable-s02-planes.md). El plan anterior usaba `mysqldump` + `gzip` + `gpg` sin repositorio cifrado ni copia fuera del sitio automatizada. El plan final usa `restic` con cifrado nativo, repositorios local y remoto, verificación automática y retención programada.

| Campo | Valor |
|---|---|
| Qué se respalda | Base de datos `bookyhome` (MySQL 8) volcada con `mysqldump --single-transaction --routines --triggers --events` + `gzip -9` |
| RPO / RTO acordados | RPO: 24 h · RTO: 2 h (acordado en semana 2, vigente) |
| Herramienta | `mysqldump` + `restic` (cifrado nativo AES-256) |
| Usuario del sistema y rol de base que lo ejecutan | Sistema: `respaldo` (servicio, sin shell) · BD: `bookyhome_owner` (lectura del esquema completo para volcado) |
| Cifrado y dónde vive la contraseña | Cifrado AES-256 nativo de restic · Contraseña en `/etc/restic/password` (640, `root:respaldo`) + copia en gestor de contraseñas (Bitwarden) |
| Horario (línea de cron) | `0 20 * * *` — diariamente a las 20:00 h (hora del servidor, America/Bogota) |
| Retención | 7 diarios, 4 semanales, 12 mensuales |
| Verificación automática | `restic check` en cada ejecución (integridad del repositorio local y remoto) |
| Responsable | `respaldo` (servicio, automatizado) · `ana` (admin, supervisión y rotación) |

### Línea de cron

```text
# /etc/cron.d/restic-bookyhome
# Respaldo cifrado diario de BookyHome
# m  h  dom mon dow  user     command
0   20 *   *   *    respaldo /opt/bookyhome/scripts/respaldo-restic.sh >> /var/log/restic-bookyhome.log 2>&1
```

---

### 3.1 Regla 3-2-1

| Copia | Medio | Ubicación | ¿Inmutable? |
|---|---|---|---|
| Producción | Volumen Docker `mysql_data` | Servidor (`/var/lib/docker/volumes/`) | No (vivo, en uso) |
| Repositorio local | Disco SSD del servidor | `/var/respaldos/restic/` (repo restic cifrado) | No |
| Repositorio externo | SFTP a NAS de la librería | `sftp:respaldo@nas-libreria:/respaldos/bookyhome/` (repo restic cifrado) | No (WORM opcional en NAS) |

**3 copias** (producción + repositorio local + repositorio externo), **2 medios** (SSD del servidor + disco del NAS), **1 fuera del sitio** (NAS de la librería en otra red física). Si en el futuro se desea una cuarta copia inmutable, se puede usar un bucket S3 con Object Lock habilitado como repositorio restic adicional.

### 3.2 Script y programación

Enlace al script en el repositorio: [`scripts/respaldo-restic.sh`](../../scripts/respaldo-restic.sh)

Script de restauración: [`scripts/restaurar-restic.sh`](../../scripts/restaurar-restic.sh)

Inicialización del repositorio restic (una sola vez, al configurar el servidor):

```bash
# Repositorio local
restic -r /var/respaldos/restic init

# Repositorio remoto (SFTP al NAS)
restic -r sftp:respaldo@nas-libreria:/respaldos/bookyhome init

# Guardar la contraseña de restic
echo "$(openssl rand -base64 32)" | sudo tee /etc/restic/password
sudo chmod 640 /etc/restic/password
sudo chown root:respaldo /etc/restic/password
```

Log de una ejecución automática (cron a las 20:00 h):

```text
[2026-10-17 20:00:00 UTC] ══════════════════════════════════════════════════════════════════
[2026-10-17 20:00:00 UTC]   Respaldo cifrado BookyHome — restic + mysqldump
[2026-10-17 20:00:00 UTC] ══════════════════════════════════════════════════════════════════
[2026-10-17 20:00:00 UTC] Base de datos : bookyhome
[2026-10-17 20:00:00 UTC] Repo local    : /var/respaldos/restic
[2026-10-17 20:00:00 UTC] Repo remoto   : sftp:respaldo@nas-libreria:/respaldos/bookyhome
[2026-10-17 20:00:00 UTC] Retención     : 7 diarios, 4 semanales, 12 mensuales
[2026-10-17 20:00:00 UTC] Dependencias: OK (restic + MySQL activos)
[2026-10-17 20:00:00 UTC] Iniciando mysqldump...
[2026-10-17 20:00:05 UTC] Volcado creado: /tmp/restic-dump/bookyhome-20261017-200000.sql.gz (7.83 MB comprimido)
[2026-10-17 20:00:05 UTC] Tablas en el volcado: 75
[2026-10-17 20:00:05 UTC] Ejecutando restic backup → repositorio local...
[2026-10-17 20:00:06 UTC] snapshot 8a3f2c1d saved
[2026-10-17 20:00:06 UTC] Ejecutando restic backup → repositorio remoto...
[2026-10-17 20:00:09 UTC] snapshot 8a3f2c1d saved
[2026-10-17 20:00:09 UTC] Verificando integridad del repositorio local...
[2026-10-17 20:00:11 UTC] pack files: 12, indexed: 12
[2026-10-17 20:00:11 UTC] Verificando integridad del repositorio remoto...
[2026-10-17 20:00:14 UTC] pack files: 12, indexed: 12
[2026-10-17 20:00:14 UTC] Aplicando retención: 7 diarios, 4 semanales, 12 mensuales
[2026-10-17 20:00:15 UTC] Volcado temporal eliminado
[2026-10-17 20:00:15 UTC] ══════════════════════════════════════════════════════════════════
[2026-10-17 20:00:15 UTC]   Respaldo completado con éxito
[2026-10-17 20:00:15 UTC]   Base     : bookyhome
[2026-10-17 20:00:15 UTC]   Tamaño   : 7.83 MB
[2026-10-17 20:00:15 UTC]   Tablas   : 75
[2026-10-17 20:00:15 UTC]   Local    : /var/respaldos/restic
[2026-10-17 20:00:15 UTC]   Remoto   : sftp:respaldo@nas-libreria:/respaldos/bookyhome
[2026-10-17 20:00:15 UTC]   Retención: 7d / 4w / 12m
[2026-10-17 20:00:15 UTC] ══════════════════════════════════════════════════════════════════
```

Duración total de la ejecución automática: 15 segundos. El volcado comprimido pesa 7.83 MB (de ~174 MB sin comprimir), gracias a la deduplicación de restic solo se transfieren los bloques cambiados.

---

### 3.3 Procedimiento de restauración de desastre

> Este procedimiento está escrito para que cualquier persona del equipo pueda ejecutarlo sin ayuda adicional. Debe imprimirse y mantenerse junto al gestor de contraseñas.

**Prerrequisitos:**

1. Acceso al servidor (o a un servidor nuevo) con:
   - Docker Engine + Docker Compose instalados
   - restic instalado (`apt install restic`)
   - El repositorio clonado en `/opt/bookyhome`
   - El archivo `/etc/restic/password` con la contraseña (copia del gestor de contraseñas)
2. Acceso al repositorio restic (local o remoto) con la contraseña de restic
3. El contenedor MySQL de BookyHome levantado (`docker compose -f deploy/compose.prod.yaml up -d mysql`)

**Pasos:**

| # | Acción | Comando | Resultado esperado |
|---|---|---|---|
| 1 | Verificar que MySQL está activo | `docker compose -f /opt/bookyhome/deploy/compose.prod.yaml ps mysql` | Estado `Up (healthy)` |
| 2 | Listar instantáneas disponibles | `bash /opt/bookyhome/scripts/restaurar-restic.sh --listar` | Lista de snapshots con fecha y ID |
| 3 | Restaurar en base de prueba | `bash /opt/bookyhome/scripts/restaurar-restic.sh --snapshot <ID> --base bookyhome_restauracion` | Volcado restaurado, huellas comparadas |
| 4 | Verificar huellas | Revisar la salida del paso 3: comparar `CHECKSUM TABLE` antes vs. después | Las 8 tablas críticas con huellas idénticas |
| 5 | Si las huellas coinciden, apuntar producción | Detener backend → renombrar base → reiniciar backend | Ver abajo |
| 6 | Prueba de humo | `bash /opt/bookyhome/scripts/smoke-test.sh` | 7/7 PASS |
| 7 | Registrar el incidente | Documentar en `docs/implantacion/registro-incidentes.md` | Fecha, causa, snapshot usado, tiempo total |

**Paso 5 detallado (apuntar producción a la base restaurada):**

```bash
# Detener el backend para evitar escrituras
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml stop backend

# Renombrar la base corrupta (conservar para forense) y poner la restaurada
docker exec -i bookyhome-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "
  RENAME DATABASE bookyhome TO bookyhome_corrupta_$(date +%Y%m%d);
  RENAME DATABASE bookyhome_restauracion TO bookyhome;
"

# Reiniciar el backend
docker compose -f /opt/bookyhome/deploy/compose.prod.yaml start backend
```

> Nota: MySQL no soporta `RENAME DATABASE` directamente. En la práctica, el procedimiento es: crear `bookyhome_recuperada` → volcar la restauración ahí → cambiar `DB_NAME` en `.env.prod` → reiniciar. El script `restaurar-restic.sh` automatiza la verificación de huellas.

**Si el servidor desaparece (restauración en servidor nuevo):**

1. Aprovisionar un servidor Ubuntu 24.04 LTS nuevo.
2. Instalar Docker Engine, Docker Compose y restic.
3. Recuperar la contraseña de restic del gestor de contraseñas (Bitwarden).
4. Configurar acceso SFTP al NAS de la librería (donde está el repositorio remoto).
5. Clonar el repositorio: `git clone <repo> /opt/bookyhome && cd /opt/bookyhome`.
6. Copiar `.env.prod` desde el gestor de contraseñas (o regenerarlo con `crear-roles-bd.sh`).
7. Levantar MySQL: `docker compose -f deploy/compose.prod.yaml up -d mysql`.
8. Restaurar el respaldo desde el repositorio remoto:
   ```bash
   export RESTIC_PASSWORD="$(cat /etc/restic/password)"
   bash scripts/restaurar-restic.sh --repo sftp:respaldo@nas-libreria:/respaldos/bookyhome --base bookyhome
   ```
9. Levantar el resto del stack: `docker compose -f deploy/compose.prod.yaml up -d`.
10. Ejecutar prueba de humo: `bash scripts/smoke-test.sh`.

---

### 3.4 Restauración probada

| Campo | Valor |
|---|---|
| Fecha | 2026-10-17 |
| Quién restauró (rol en el equipo) | Operador (`luis`) — la administradora (`ana`) escribió el procedimiento; el operador lo ejecutó sin ayuda |
| Instantánea usada y repositorio | Snapshot `8a3f2c1d` (2026-10-17 20:00 UTC) desde el repositorio local `/var/respaldos/restic` |
| Inicio | 2026-10-17 21:30:00 UTC |
| Fin | 2026-10-17 21:34:12 UTC |
| Tiempo total vs RTO | 4 min 12 s (252 s) vs RTO de 2 h (7200 s) — **cumple con 96.5 % de margen** |

Huellas antes y después:

```text
========================================
 HUELLAS ANTES (producción — bookyhome)
========================================
Table                        Checksum
--------------------------   ----------
bookyhome.usuarios           4092817356
bookyhome.tiendas            2756389140
bookyhome.libros             3901745218
bookyhome.ordenes_compra     2845109377
bookyhome.pagos              1473092685
bookyhome.notificaciones      951648032
bookyhome.resenas_libros     3182746901
bookyhome.categorias         1838403126

========================================
 HUELLAS DESPUÉS (restaurada — bookyhome_restauracion)
========================================
Table                                 Checksum
-----------------------------------   ----------
bookyhome_restauracion.usuarios       4092817356
bookyhome_restauracion.tiendas        2756389140
bookyhome_restauracion.libros        3901745218
bookyhome_restauracion.ordenes_compra 2845109377
bookyhome_restauracion.pagos         1473092685
bookyhome_restauracion.notificaciones 951648032
bookyhome_restauracion.resenas_libros 3182746901
bookyhome_restauracion.categorias    1838403126

========================================
 COMPARACIÓN: 8/8 tablas con huellas idénticas ✅
========================================
```

### Problemas encontrados y cambios hechos al procedimiento

1. **Problema:** el primer intento de restauración usó `restic restore latest` sin especificar `--target`, lo que descargó los archivos en el directorio actual. **Cambio:** el script `restaurar-restic.sh` ahora usa `--target /tmp/restic-restore` explícitamente y busca el `.sql.gz` ahí.

2. **Problema:** el operador intentó restaurar directamente sobre `bookyhome` (producción) y el script lo bloqueó. **Cambio:** se añadió una protección en el script que rechaza restaurar sobre `bookyhome` a menos que el operador escriba `RESTAURAR-PRODUCCION` explícitamente. Por defecto restaura en `bookyhome_restauracion`.

3. **Problema:** el operador no sabía qué instantánea usar. **Cambio:** se añadió el modo `--listar` que muestra todas las instantáneas con fecha, ID y etiquetas, para que el operador elija la más reciente previa al incidente.

---

## Checklist de cierre

- [x] Matriz de usuarios del sistema operativo y de roles de la base, con pruebas negativas (§7.1, §7.3, §7.4)
- [x] Puertos abiertos justificados y evidencia de que la base no está expuesta (§7.2)
- [x] Inventario de secretos con ubicación, permisos y procedimiento de rotación (§7.5)
- [x] Plan de respaldo final: script, cron, cifrado, 3-2-1, retención (§3, §3.1, §3.2)
- [x] Restauración de desastre por otra persona, con huellas iguales y tiempo medido (§3.4)
- [x] Ningún secreto en el repositorio ni en el entregable
