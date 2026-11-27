# 📦 Migraciones de base de datos (BookyHome)

⚠️ **¡LEER ANTES DE TOCAR LA BASE DE DATOS!** ⚠️

Este directorio (`database/migrations/`) contiene **scripts SQL incrementales**. Su objetivo es actualizar la estructura o los datos de la base de datos *sin tener que borrarla ni recrearla desde cero*.

El procedimiento completo para aplicar migraciones, crear backups y restaurar datos esta documentado en [docs/implantacion/plan-migracion-respaldos.md](../../docs/implantacion/plan-migracion-respaldos.md).

## 🚫 LO QUE **NO** DEBES HACER (Errores Comunes)

1. **NO** copies y pegues el código de estos archivos dentro del archivo principal `database/bookyhome.sql`. Ese archivo es solo para la carga inicial de una base de datos virgen.
2. **NO** intentes buscar las tablas en tu gestor (ej. phpMyAdmin) para agregar las columnas a mano. Deja que el script haga el trabajo por ti para evitar errores humanos.
3. **NO** agregues un archivo local `000-schema.sql` a esta carpeta. Docker Compose monta `database/bookyhome.sql` con ese nombre dentro del contenedor; el esquema base sigue en `database/bookyhome.sql`.

---

## ✅ LO QUE **SÍ** DEBES HACER (Cómo implementar una migración)

Cuando un compañero de equipo (o tú mismo) baje cambios nuevos de Git y vea que hay un archivo nuevo en esta carpeta, **tienes que ejecutar ese archivo en tu base de datos local**. Docker Compose ejecuta estos archivos automáticamente solo al inicializar un volumen MySQL nuevo; no aplica migraciones nuevas en un volumen ya existente. Por ejemplo, actualmente las migraciones usan nombres como `001_add_usuario_profile_columns.sql`.

Existen varias formas de hacerlo. Elige **SOLO UNA** de las siguientes opciones:

### Opción 1: Tienes el proyecto corriendo con Docker (Recomendado ⭐)

Si usas Docker Compose para levantar el proyecto, abre una terminal en la raíz del proyecto y corre:

```bash
docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" bookyhome' < database/migrations/NOMBRE_DEL_ARCHIVO.sql
```

*(Cambia `NOMBRE_DEL_ARCHIVO.sql` por el nombre real del archivo que quieres aplicar).*

Si estás en PowerShell, la forma correcta es:

```powershell
Get-Content database/migrations/NOMBRE_DEL_ARCHIVO.sql | docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" bookyhome'
```

> En PowerShell no se usa el operador `<` como en Bash; por eso se reemplaza con `Get-Content` y el pipe `|`. La contraseña se toma de la configuración local del contenedor y no se escribe en el comando.

### Opción 2: Usas un gestor visual (phpMyAdmin, MySQL Workbench, DBeaver)

1. Abre el gestor visual de tu preferencia y conéctate a tu base de datos local.
2. Selecciona la base de datos `bookyhome`.
3. Abre el archivo `.sql` de la migración (ej. `001_add_usuario_profile_columns.sql`) en tu editor de código.
4. **Copia absolutamente TODO el texto** del archivo.
5. Pégalo en la pestaña "SQL" o "Consola de consultas" de tu gestor visual y dale al botón de **Ejecutar**.

### Opción 3: Usas XAMPP / WAMP / Línea de comandos pura

Abre tu consola, asegúrate de tener el comando `mysql` disponible y ejecuta:

```bash
mysql -u root -p bookyhome < database/migrations/NOMBRE_DEL_ARCHIVO.sql
```

---

## 💡 Nota de seguridad
No asumas que una migración se puede ejecutar más de una vez sin efectos: algunas también insertan o modifican datos. Haz un backup antes de aplicarla y revisa el script si no estás seguro de su impacto.
