-- =============================================================================
-- BookyHome — Migración 000: Creación de Usuarios, Roles y Privilegios (MySQL 8)
-- Ficha SENA ADSO: 3171618
-- Administrador / Dueño: Cristopher León (cristopher_admin)
-- Equipo de Desarrollo: Liz Nayibe, Juan Pineda, Andrés Murcia
-- Principio: Mínimo Privilegio (Principle of Least Privilege)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `bookyhome`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bookyhome`;

-- -----------------------------------------------------------------------------
-- 1. USUARIO ADMINISTRADOR / DUEÑO (Cristopher León)
--    Control total sobre la base de datos (DDL + DML + DCL con delegación)
-- -----------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'cristopher_admin'@'%' 
  IDENTIFIED BY 'AdminCrisBooky2026*';

GRANT ALL PRIVILEGES ON `bookyhome`.* 
  TO 'cristopher_admin'@'%' 
  WITH GRANT OPTION;

-- -----------------------------------------------------------------------------
-- 2. USUARIOS DEL EQUIPO DE DESARROLLO (Roles DML con Mínimo Privilegio)
--    Permisos: SELECT, INSERT, UPDATE, DELETE en datos de la aplicación.
--    Restricciones: NO pueden ejecutar DROP DATABASE, ALTER TABLE ni crear usuarios.
-- -----------------------------------------------------------------------------

-- 2.1 Liz Nayibe
CREATE USER IF NOT EXISTS 'liz_nayibe'@'%' 
  IDENTIFIED BY 'LizBooky2026*';

GRANT SELECT, INSERT, UPDATE, DELETE 
  ON `bookyhome`.* 
  TO 'liz_nayibe'@'%';

-- 2.2 Juan Pineda
CREATE USER IF NOT EXISTS 'juan_pineda'@'%' 
  IDENTIFIED BY 'JuanBooky2026*';

GRANT SELECT, INSERT, UPDATE, DELETE 
  ON `bookyhome`.* 
  TO 'juan_pineda'@'%';

-- 2.3 Andrés Murcia
CREATE USER IF NOT EXISTS 'andres_murcia'@'%' 
  IDENTIFIED BY 'AndresBooky2026*';

GRANT SELECT, INSERT, UPDATE, DELETE 
  ON `bookyhome`.* 
  TO 'andres_murcia'@'%';

-- -----------------------------------------------------------------------------
-- 3. USUARIO DE SERVICIO PARA LA APLICACIÓN (FastAPI Backend / Render)
--    Permisos: Solo lectura y escritura de datos necesarios para operar.
-- -----------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'bookyhome_app'@'%' 
  IDENTIFIED BY 'BookyAppSecure2026!';

GRANT SELECT, INSERT, UPDATE, DELETE 
  ON `bookyhome`.* 
  TO 'bookyhome_app'@'%';

-- -----------------------------------------------------------------------------
-- 4. APLICAR PRIVILEGIOS
-- -----------------------------------------------------------------------------
FLUSH PRIVILEGES;

-- -----------------------------------------------------------------------------
-- 5. VERIFICACIÓN DE PRIVILEGIOS ASIGNADOS
-- -----------------------------------------------------------------------------
SHOW GRANTS FOR 'cristopher_admin'@'%';
SHOW GRANTS FOR 'liz_nayibe'@'%';
SHOW GRANTS FOR 'juan_pineda'@'%';
SHOW GRANTS FOR 'andres_murcia'@'%';
SHOW GRANTS FOR 'bookyhome_app'@'%';
