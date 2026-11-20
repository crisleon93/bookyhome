# Gestión de Usuarios, Roles y Privilegios en MySQL — BookyHome

**Proyecto:** BookyHome  
**Ficha SENA ADSO:** 3171618  
**Motor de Base de Datos:** MySQL 8.0  
**Principio de Seguridad:** Mínimo Privilegio (*Principle of Least Privilege*)  

---

## 1. Matriz de Usuarios y Roles

| Usuario | Nombre Real | Rol / Función | Privilegios Otorgados | Restricciones de Seguridad |
|---|---|---|---|---|
| `cristopher_admin` | Cristopher León | **Dueño / DBA Administrador** | `ALL PRIVILEGES ON bookyhome.* WITH GRANT OPTION` | Control total del esquema y administración de usuarios. |
| `liz_nayibe` | Liz Nayibe | **Desarrolladora (DML)** | `SELECT, INSERT, UPDATE, DELETE ON bookyhome.*` | No puede borrar bases de datos (`DROP`), ni modificar usuarios (`DCL`). |
| `juan_pineda` | Juan Pineda | **Desarrollador (DML)** | `SELECT, INSERT, UPDATE, DELETE ON bookyhome.*` | No puede borrar bases de datos (`DROP`), ni modificar usuarios (`DCL`). |
| `andres_murcia` | Andrés Murcia | **Desarrollador (DML)** | `SELECT, INSERT, UPDATE, DELETE ON bookyhome.*` | No puede borrar bases de datos (`DROP`), ni modificar usuarios (`DCL`). |
| `bookyhome_app` | Backend FastAPI | **Usuario de Aplicación (Servicio)** | `SELECT, INSERT, UPDATE, DELETE ON bookyhome.*` | Sin privilegios DDL (`CREATE`, `DROP`, `ALTER`). Previene destrucción en caso de inyección SQL. |

---

## 2. Script SQL de Implementación

El script se encuentra versionado en el repositorio en:  
[`database/migrations/000_usuarios_y_privilegios_equipo.sql`](../../database/migrations/000_usuarios_y_privilegios_equipo.sql)

### Ejecución:
```bash
mysql -u root -p < database/migrations/000_usuarios_y_privilegios_equipo.sql
```

---

## 3. Pruebas de Verificación de Privilegios

### Consulta de Privilegios Asignados:
```sql
SHOW GRANTS FOR 'cristopher_admin'@'%';
-- Salida: GRANT ALL PRIVILEGES ON `bookyhome`.* TO 'cristopher_admin'@'%' WITH GRANT OPTION

SHOW GRANTS FOR 'liz_nayibe'@'%';
-- Salida: GRANT SELECT, INSERT, UPDATE, DELETE ON `bookyhome`.* TO 'liz_nayibe'@'%'

SHOW GRANTS FOR 'juan_pineda'@'%';
-- Salida: GRANT SELECT, INSERT, UPDATE, DELETE ON `bookyhome`.* TO 'juan_pineda'@'%'

SHOW GRANTS FOR 'andres_murcia'@'%';
-- Salida: GRANT SELECT, INSERT, UPDATE, DELETE ON `bookyhome`.* TO 'andres_murcia'@'%'

SHOW GRANTS FOR 'bookyhome_app'@'%';
-- Salida: GRANT SELECT, INSERT, UPDATE, DELETE ON `bookyhome`.* TO 'bookyhome_app'@'%'
```

### Prueba de Mínimo Privilegio (Comportamiento esperado):
1. **Consulta permitida (Desarrollador):**
   ```sql
   -- Conectado como liz_nayibe
   SELECT id_libro, titulo, precio FROM libros LIMIT 5;
   -- Resultado: 5 filas devueltas (Exitoso)
   ```
2. **Operación destructiva bloqueada (Desarrollador o App):**
   ```sql
   -- Conectado como juan_pineda o bookyhome_app
   DROP TABLE usuarios;
   -- Resultado: ERROR 1142 (42000): DROP command denied to user for table 'usuarios'
   ```
