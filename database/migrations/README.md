# Migraciones de base de datos

Este directorio contiene los cambios de esquema que pueden aplicarse de forma reproducible.

## Ejecutar una migración

### Opción 1: Desde Docker Compose (recomendado para desarrollo)

Desde la raíz del proyecto:

```bash
docker compose exec -T mysql mysql -uroot -proot bookyhome < database/migrations/001_add_usuario_profile_columns.sql
```

### Opción 2: Desde línea de comandos MySQL (fuera de Docker)

```bash
mysql -u root -p bookyhome < database/migrations/001_add_usuario_profile_columns.sql
```

### Opción 3: Desde MySQL Workbench o phpMyAdmin

1. Abrir el archivo de migración (ej: `001_add_usuario_profile_columns.sql`)
2. Seleccionar TODO el contenido (Ctrl+A)
3. Ejecutarlo en la consola SQL de la base de datos `bookyhome`

### Opción 4: Desde la consola de MySQL

```bash
mysql -u root -p
USE bookyhome;
SOURCE database/migrations/001_add_usuario_profile_columns.sql;
```

**Nota:** Las migraciones están diseñadas para ser seguras - verifican si las columnas ya existen antes de agregarlas, por lo que pueden ejecutarse múltiples veces sin causar errores.
