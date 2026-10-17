# deploy/ — Configuración de producción

Esta carpeta contiene todo lo necesario para desplegar BookyHome en producción.  
**No modifiques estos archivos directamente en la rama `develop`** — los cambios de producción van en una rama `release/` o `hotfix/`.

---

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `compose.prod.yaml` | Docker Compose de producción. Sin volúmenes de código, sin `--reload`, puertos internos cerrados al exterior. |
| `Caddyfile.prod` | Configuración del reverse proxy Caddy para producción. Obtiene el certificado TLS de Let's Encrypt automáticamente. |
| `env.prod.example` | Plantilla con todas las variables de entorno necesarias. **Valores ficticios — no contiene secretos reales.** |
| `.env.prod` | ⚠️ **No está en el repo** (está en `.gitignore`). Solo existe en el servidor. Ver instrucciones abajo. |
| `render.yaml` | Blueprint para despliegue automático en Render (PaaS). Render lo detecta al conectar el repositorio. |

---

## Cómo configurar el servidor por primera vez

```bash
# 1. Clona el repositorio en el servidor
git clone <url-del-repo> /opt/bookyhome
cd /opt/bookyhome

# 2. Crea el archivo de variables de entorno a partir de la plantilla
cp deploy/env.prod.example deploy/.env.prod

# 3. Abre el archivo y completa TODOS los valores
#    (contraseñas, claves JWT, API keys, correo, etc.)
nano deploy/.env.prod

# 4. Levanta los servicios
APP_VERSION=1.0.0 docker compose -f deploy/compose.prod.yaml up -d

# 5. Verifica que todo funciona
bash scripts/smoke-test.sh https://api.bookyhome.com.co https://bookyhome.com.co
```

---

## Variables que SÍ debes completar en `.env.prod`

Estas son las que no tienen un valor por defecto seguro:

| Variable | Cómo obtenerla |
|---|---|
| `DB_PASSWORD` | Inventar una contraseña fuerte (mínimo 16 caracteres) |
| `SECRET_KEY` | Generar con `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Cuenta de Gmail con contraseña de aplicación ([ver guía](https://support.google.com/accounts/answer/185833)) |
| `GEMINI_API_KEY` | Crear en [Google AI Studio](https://aistudio.google.com/app/apikey) |

---

## Reglas importantes

- ❌ **Nunca** subas `.env.prod` al repositorio — Git ya lo ignora, pero igual ten cuidado con `git add .`
- ❌ **Nunca** pongas contraseñas reales en `env.prod.example`
- ✅ Si agregas una variable nueva al backend, agrégala también a `env.prod.example` con un valor ficticio
- ✅ Ante cualquier duda sobre el proceso completo, revisa [`docs/implantacion/entregable-s04-procedimiento-despliegue.md`](../docs/implantacion/entregable-s04-procedimiento-despliegue.md)
