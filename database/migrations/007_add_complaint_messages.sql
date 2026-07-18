-- Conversación entre comprador, vendedor y administrador dentro de un reclamo.
CREATE TABLE IF NOT EXISTS mensajes_reclamo (
  id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud INT NOT NULL,
  id_usuario INT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mensajes_reclamo_solicitud (id_solicitud),
  CONSTRAINT fk_mensajes_reclamo_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitudes_soporte(id_solicitud) ON DELETE CASCADE,
  CONSTRAINT fk_mensajes_reclamo_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
