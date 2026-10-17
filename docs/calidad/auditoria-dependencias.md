# Auditoría de Dependencias — BookyHome

**Fecha de auditoría:** 2026-10-17
**Herramientas usadas:** `pip-audit 2.10.1` (backend) · `pnpm audit` (frontend)
**Resultado general:** Backend limpio ✅ · Frontend con 17 vulnerabilidades transitivas sin fix upstream ⚠️

---

## 1. Criterios de revisión

El profe solicitó verificar dos cosas:

1. **Dependencias pineadas** — todas las versiones deben ser exactas (`==` en Python, sin `^` ni `~` en JS).
2. **Sin vulnerabilidades conocidas** — ningún CVE activo sin parche disponible en los paquetes directos del proyecto.

---

## 2. Backend (FastAPI / Python)

### 2.1 Estado de pineado

Todas las dependencias en `backend/pyproject.toml` usan versión exacta con `==`. **✅ Cumple.**

```toml
fastapi==0.143.3
fastapi-mail==1.6.8
cryptography==50.0.0
pyjwt==2.15.0
python-multipart==0.0.31
bcrypt==4.0.1
pydantic==2.12.5
uvicorn==0.42.0
# ... (ver pyproject.toml para lista completa)
```

### 2.2 Vulnerabilidades encontradas y corregidas

Durante la auditoría con `pip-audit` se encontraron **45 CVEs en 4 paquetes**. Todos fueron corregidos actualizando a las versiones indicadas por el advisory:

| Paquete | Versión anterior | Versión corregida | CVEs resueltos |
|---|---|---|---|
| `PyJWT` | 2.12.1 | **2.15.0** | PYSEC-2026-175/176/177/178/179, PYSEC-2026-4140..4152/4183 |
| `cryptography` | 46.0.7 | **50.0.0** | PYSEC-2026-3552/3553/3554, GHSA-537c-gmf6-5ccf |
| `python-multipart` | 0.0.22 | **0.0.31** | PYSEC-2026-3036/3037/3038/3039/3040 |
| `starlette` | 0.52.1 | **1.8.0** (transitiva vía fastapi) | PYSEC-2026-161/248/249/2280/2281 |

> `fastapi-mail` fue actualizado de `1.6.2` a `1.6.8` porque su versión anterior bloqueaba
> la actualización de `cryptography` con el rango `>=46,<47`. La versión `1.6.8` elimina esa restricción.
> `fastapi` fue actualizado de `0.135.1` a `0.143.3` para alinear con la nueva versión de `starlette`.

### 2.3 Estado final

```
$ uv run pip-audit
No known vulnerabilities found
```

**✅ 0 vulnerabilidades conocidas en el backend.**

---

## 3. Frontend (React / Node)

### 3.1 Estado de pineado

Todas las dependencias en `frontend/package.json` usan versión exacta sin rangos. **✅ Cumple.**

```json
"axios": "1.20.0",
"react": "19.2.4",
"react-router-dom": "7.18.4",
"vite": "8.3.4"
```

### 3.2 Vulnerabilidades encontradas y corregidas

`pnpm audit` reportó vulnerabilidades en 3 paquetes directos, todos corregidos:

| Paquete | Versión anterior | Versión corregida | Vulnerabilidades |
|---|---|---|---|
| `vite` | 8.0.1 | **8.3.4** | `server.fs.deny` bypass (Windows + general), Arbitrary File Read |
| `axios` | 1.13.6 | **1.20.0** | Prototype Pollution, Header Injection, ReDoS, Credential Leak, MITM |
| `react-router-dom` | 7.13.1 | **7.18.4** | XSS en RSC mode, DoS, CSRF bypass |

### 3.3 Vulnerabilidades transitivas sin fix disponible — flowbite

Después de las actualizaciones, quedan **17 vulnerabilidades** reportadas por `pnpm audit`. Todas son **transitivas** originadas en las dependencias internas de `flowbite@4.0.2` y `flowbite-react@0.12.17`:

| Sub-paquete afectado | Vulnerabilidad | Ruta |
|---|---|---|
| `brace-expansion` | DoS (exponential expansion, recursión sin límite) | `flowbite > postcss > brace-expansion` |
| `js-yaml` | Quadratic CPU / maxTotalMergeKeys DoS | `flowbite > postcss > js-yaml` |
| `nanoid` | Loop infinito en generadores | `flowbite > postcss > nanoid` |
| `postcss` | Path Traversal en source maps | `flowbite > postcss` |
| `source-map-js` | Event-loop DoS | `flowbite > postcss > source-map-js` |
| `deepmerge-ts` | Stack exhaustion | `flowbite-react > deepmerge-ts` |
| `browserslist` | Unbounded memory growth, prototype write | `flowbite > browserslist` |

**Por qué no se pueden corregir directamente:**
Estas versiones están fijadas dentro del `package.json` de `flowbite` y `flowbite-react`. Actualizar esas sub-dependencias directamente en el proyecto rompería la integridad del lockfile de `flowbite`. El mantenedor de `flowbite` debe publicar una versión nueva que actualice sus propias dependencias internas.

**Impacto real en producción:** bajo — `postcss`, `nanoid` y `brace-expansion` son herramientas de build/dev. No se ejecutan en el bundle final que llega al usuario. Las vulnerabilidades de DoS en herramientas de build solo son explotables si un atacante tiene acceso al entorno de desarrollo o CI.

**Acción tomada:** se intentó actualizar `flowbite` y `flowbite-react` a sus últimas versiones disponibles (`4.0.2` y `0.12.17` respectivamente, ya las más recientes), pero el upstream no ha corregido las dependencias internas aún.

**Seguimiento:** se añade este ítem al backlog para revisión cuando `flowbite` publique una versión con las sub-dependencias corregidas. El `dependabot.yml` del repositorio alertará automáticamente cuando haya una nueva versión disponible.

---

## 4. Comandos para reproducir la auditoría

**Backend:**
```bash
cd backend
uv run pip-audit
```

**Frontend:**
```bash
cd frontend
pnpm audit
```

---

## 5. Resumen ejecutivo

| Capa | Dependencias pineadas | Vulnerabilidades directas | Vulnerabilidades transitivas sin fix |
|---|---|---|---|
| Backend | ✅ Todas con `==` | ✅ 0 (45 corregidas) | ✅ 0 |
| Frontend | ✅ Todas sin `^`/`~` | ✅ 0 (corregidas en vite, axios, react-router) | ⚠️ 17 en sub-deps de flowbite (solo build tools, no llegan a producción) |
