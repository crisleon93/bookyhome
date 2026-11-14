# Entregable S03 — Estrategia de Hosting y Dominio

| Campo    | Valor             |
|----------|-------------------|
| Proyecto | BookyHome         |
| Equipo   | Equipo BookyHome  |
| Fecha    | 2026-10-17        |

---

## 4.1 Tipo de hosting por componente

| Componente | Tipo de hosting | Proveedor candidato | Justificación |
|---|---|---|---|
| **Frontend (build estático — React/Vite)** | **Estático (CDN)** | **Render Static Site** | El build de Vite genera archivos HTML/CSS/JS puros; no necesita servidor de aplicaciones. Render entrega el sitio desde CDN con HTTPS automático y sin costo de servidor. |
| **API REST (FastAPI/Uvicorn en Docker)** | **PaaS (contenedor)** | **Render Web Service** | Corre la imagen Docker sin administrar SO; gestiona escalado y reinicio automático. Alternativa: VM Ubuntu 24.04 LTS (servidor propio del cliente) con Docker Compose si se prefiere control total. |
| **Base de datos MySQL 8** | **DBaaS / gestionado** | **PlanetScale (MySQL)** o **Railway** | Ofrece backups automáticos, conexiones seguras y panel de métricas sin administrar el servidor de base de datos. En la VM del cliente se puede usar el contenedor MySQL del Compose (ver plan de instalación §5). |
| **Archivos subidos (imágenes de libros)** | **Object storage** | **Backblaze B2 / Cloudflare R2** | Los volúmenes Docker no son apropiados para almacenamiento en PaaS. Object storage escala sin límite y se integra vía URL pública o presigned URL. En servidor propio se mantiene el volumen `uploads_data` detrás del proxy. |
| **App móvil (Expo/React Native)** | **Sin servidor propio** | **Expo Application Services (EAS)** | La app es un cliente; se distribuye vía tiendas (Play Store / App Store) o como APK directo. No requiere hosting de servidor. |

> **Alternativa en servidor propio (VM Ubuntu del cliente):**  
> Si el cliente prefiere no depender de PaaS, los tres servicios (frontend compilado como archivos estáticos, API y MySQL) corren en una sola VM Ubuntu 24.04 LTS con Docker Compose, expuestos al exterior solo a través de Caddy en los puertos 80/443. Los puertos 8000 y 3306 quedan cerrados al exterior (ver §4.4).

---

## 4.2 Dominio

| Campo | Valor |
|---|---|
| Nombre de dominio | `bookyhome.com.co` (dominio propio) |
| Tipo | Propio — registrado por el cliente (o por el equipo técnico a nombre del cliente) |
| Registrador / proveedor | **Namecheap** o **Google Domains** (a definir con el cliente al momento de la compra) |
| Subdominio de API | `api.bookyhome.com.co` |
| Subdominio de panel de administración | `admin.bookyhome.com.co` (apunta al mismo frontend; la ruta `/admin` controla el acceso) |
| Responsable de pago y renovación | Rol: coordinador de la librería (propietario del dominio) |
| Fecha de vencimiento | 1 año desde la compra; renovación automática activada para evitar expiración accidental |

> En el entorno local de prueba se usan los nombres `bookyhome.local` y `api.bookyhome.local` con `tls internal` de Caddy (sin necesidad de dominio real ni acceso a Internet).

---

## 4.3 Registros DNS

> Los valores de IP/host son ficticios y representativos; se sustituirán por los valores reales al aprovisionar el servidor o el servicio PaaS en la semana 4.

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---|---|
| `@` | `A` | `<ip-servidor>` | `3600` | Raíz del dominio — apunta al servidor o al IP del load balancer |
| `www` | `CNAME` | `bookyhome.com.co.` | `3600` | Alias para `www.bookyhome.com.co` |
| `api` | `CNAME` | `<servicio>.onrender.com.` | `3600` | API en Render Web Service (PaaS) |
| `admin` | `CNAME` | `bookyhome.com.co.` | `3600` | Panel de administración (mismo frontend) |
| `@` | `MX` | `mail.bookyhome.com.co.` con prioridad `10` | `3600` | Correo entrante (si se usa dominio propio para correo) |
| `@` | `TXT` | `v=spf1 include:_spf.google.com ~all` | `3600` | SPF anti-spam para envío de correos transaccionales |
| `_dmarc` | `TXT` | `v=DMARC1; p=none; rua=mailto:admin@bookyhome.com.co` | `3600` | Política DMARC inicial (monitoreo) |

> **TTL recomendado** durante la migración o primer despliegue: bajar a `300` (5 min) para que los cambios propaguen rápido. Subir a `3600` una vez estabilizado.

---

## 4.4 Camino de una petición

### Ruta completa (producción con servidor propio)

1. El usuario abre `https://bookyhome.com.co` en su navegador.
2. El sistema operativo consulta el **resolver DNS** local (o del ISP).
3. El resolver pregunta a los **servidores autoritativos** de `bookyhome.com.co`; obtiene el registro `A` con la IP del servidor.
4. El navegador establece una conexión TCP al **puerto 443** del servidor y negocia TLS (certificado gestionado por Caddy con Let's Encrypt).
5. **Caddy** recibe la petición HTTPS, verifica el `Host`, y la reenvía por HTTP interno al contenedor del **frontend** (puerto `5173` en desarrollo / archivos estáticos en producción).
6. Si la petición es a `https://api.bookyhome.com.co`, Caddy la reenvía al contenedor del **backend FastAPI** (puerto `8000`, solo red interna Docker).
7. El backend consulta **MySQL** en la red interna de Docker (puerto `3306`, nunca expuesto a Internet).
8. La respuesta recorre el camino inverso hasta el navegador del usuario.

```
Usuario
  │
  ▼ DNS: bookyhome.com.co → <ip-servidor>
  │
  ▼ TCP :443 (HTTPS / TLS — Caddy + Let's Encrypt)
  │
  ┌──────────────────────────────────────────────────────────┐
  │  Servidor Ubuntu 24.04 LTS                               │
  │                                                          │
  │  Caddy (puertos 80 / 443)                                │
  │    ├── bookyhome.com.co      → frontend :5173 (interno)  │
  │    └── api.bookyhome.com.co  → backend  :8000 (interno)  │
  │                                                          │
  │  Red interna Docker                                      │
  │    backend :8000 ──────────────────→ mysql :3306         │
  └──────────────────────────────────────────────────────────┘
```

### Puertos abiertos a Internet (firewall del servidor)

| Puerto | Servicio | ¿Por qué debe estar abierto? |
|---|---|---|
| `80/tcp` | HTTP (Caddy) | Recibe peticiones HTTP y las redirige a HTTPS; también necesario para el desafío ACME de Let's Encrypt |
| `443/tcp` | HTTPS (Caddy) | Tráfico cifrado hacia el frontend y la API |
| `22/tcp` | SSH | Administración remota segura del servidor (idealmente solo desde IPs de confianza) |

### Puertos cerrados al exterior (solo red interna)

| Puerto | Servicio | Razón para mantenerlo cerrado |
|---|---|---|
| `8000` | Backend FastAPI | Solo Caddy lo necesita; exponerlo al exterior omite el proxy y sus cabeceras de seguridad |
| `3306` | MySQL | Nunca debe ser accesible desde Internet; solo el backend lo consulta en la red Docker interna |
| `5173` | Vite (dev) | El servidor de desarrollo no debe estar expuesto; en producción se sirve el build estático |

---

## 4.5 Reverse proxy

### Archivo en el repositorio

`Caddyfile` en la raíz del proyecto (`/Caddyfile`).

```caddy
{
    local_certs
    admin off
}

bookyhome.local {
    tls internal
    reverse_proxy localhost:5173
}

api.bookyhome.local {
    tls internal
    reverse_proxy localhost:8000
}

http://bookyhome.local {
    redir https://bookyhome.local{uri} permanent
}

http://api.bookyhome.local {
    redir https://api.bookyhome.local{uri} permanent
}
```

### Cómo probarlo localmente

```bash
# 1. Confiar en la CA local de Caddy (solo la primera vez)
caddy trust

# 2. Iniciar Caddy con el Caddyfile del repositorio
caddy run --config Caddyfile

# 3. Probar el frontend
curl --resolve bookyhome.local:443:127.0.0.1 \
     https://bookyhome.local/ \
     -o /dev/null -s -w "%{http_code}\n"

# 4. Probar la API
curl --resolve api.bookyhome.local:443:127.0.0.1 \
     https://api.bookyhome.local/health \
     -s
```

### Evidencia de prueba local

Prueba ejecutada el 2026-10-17 con los tres contenedores de Docker Compose corriendo (`docker compose up -d`).  
Caddy v2.9.1 instaló el certificado CA local automáticamente en el almacén de Windows (`certificate installed properly in windows trusts`).  
Se usa `--insecure` porque `curl` en Windows no lee el almacén de Windows nativo; el navegador sí confía en el certificado sin advertencias.

```
=== Prueba 1: Frontend (esperado: HTTP 200) ===
$ curl --resolve bookyhome.local:443:127.0.0.1 https://bookyhome.local/ -o NUL -s -w "HTTP %{http_code}" --insecure
HTTP 200

=== Prueba 2: API raíz (esperado: JSON de bienvenida) ===
$ curl --resolve api.bookyhome.local:443:127.0.0.1 https://api.bookyhome.local/ -s --insecure
{"mensaje":"BookyHome API funcionando"}

=== Prueba 3: API /docs (esperado: HTTP 200) ===
$ curl --resolve api.bookyhome.local:443:127.0.0.1 https://api.bookyhome.local/docs -o NUL -s -w "HTTP %{http_code}" --insecure
HTTP 200

=== Prueba 4: Redirección HTTP → HTTPS (esperado: 301) ===
$ curl --resolve bookyhome.local:80:127.0.0.1 http://bookyhome.local/ -o NUL -s -w "HTTP %{http_code}"
HTTP 301
```

**Contenedores activos durante la prueba:**

```
NAME               IMAGE          STATUS
bookyhome-mysql    mysql:8.0      Up (healthy)   0.0.0.0:3306->3306/tcp
contenedor-back    bkh-backend    Up             0.0.0.0:8000->8000/tcp
contenedor-front   bkh-frontend   Up             0.0.0.0:5173->5173/tcp
```

> **Nota:** el endpoint de salud de la API es `GET /` → `{"mensaje":"BookyHome API funcionando"}`.  
> Se agregó `bookyhome.local` a `allowedHosts` en `frontend/vite.config.js` para que el servidor de desarrollo Vite acepte peticiones a través del proxy (protección de host de Vite 5+).

---

## 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| Respaldos de base de datos (`.sql.gz`) | **SFTP** (subsistema SSH) | Llave SSH Ed25519 de un usuario solo-SFTP (sin shell, `ChrootDirectory` configurado) | Diaria, automatizada por el script `scripts/respaldar.sh` |
| Imágenes de libros (`uploads_data`) | **SCP / rsync sobre SSH** | Misma llave SSH del usuario de respaldo | Semanal o tras cada despliegue |
| Código / imagen Docker | **Git push** al repositorio + CI/CD en Render (o `git pull` + `docker compose pull` en el servidor) | Clave SSH del repositorio Git | Con cada despliegue |
| Archivo `.env` (variables de entorno) | **SCP** manual, una sola vez en el servidor destino | Llave SSH del responsable técnico | Solo al instalar o al rotar credenciales |
| Certificados TLS (en servidor propio) | Gestionados automáticamente por Caddy (Let's Encrypt ACME) | No aplica — renovación automática | Automática cada ~60 días |

### Configuración del usuario SFTP (extracto)

```bash
# /etc/ssh/sshd_config — agregar al final
Match User sftp-bookyhome
    ForceCommand internal-sftp
    ChrootDirectory /srv/backups/bookyhome
    PasswordAuthentication no
    AllowTcpForwarding no
    X11Forwarding no
```

```bash
# Crear el usuario (sin shell)
sudo useradd -m -s /usr/sbin/nologin sftp-bookyhome
sudo mkdir -p /srv/backups/bookyhome
sudo chown root:root /srv/backups/bookyhome
sudo chmod 755 /srv/backups/bookyhome

# Copiar la llave pública
sudo mkdir -p /home/sftp-bookyhome/.ssh
sudo tee /home/sftp-bookyhome/.ssh/authorized_keys <<'EOF'
<clave-publica-ed25519-del-equipo>
EOF
sudo chown -R sftp-bookyhome: /home/sftp-bookyhome/.ssh
sudo chmod 700 /home/sftp-bookyhome/.ssh
sudo chmod 600 /home/sftp-bookyhome/.ssh/authorized_keys
```

> Sin IPs, hosts, usuarios reales ni contraseñas en este documento.

---

## Checklist de cierre

- [x] Tipo de hosting elegido y justificado por componente (§4.1)
- [x] Dominio definido con tabla de registros DNS y TTL (§4.2 y §4.3)
- [x] Diagrama y descripción del camino de una petición con tabla de puertos (§4.4)
- [x] `Caddyfile` en la raíz del repositorio, probado localmente con instrucciones `curl --resolve` (§4.5)
- [x] Método de transferencia de archivos con autenticación por llave SSH (§4.6)
- [x] Sin IPs, hosts, usuarios ni contraseñas reales
