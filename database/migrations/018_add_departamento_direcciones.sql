-- Conserva el departamento de las direcciones de envío creadas desde web o móvil.
ALTER TABLE direcciones_envio
    ADD COLUMN departamento VARCHAR(50) NULL AFTER ciudad;
