-- Migración 008: Crear tabla push_tokens para notificaciones Expo Push
USE bookyhome;

CREATE TABLE IF NOT EXISTS push_tokens (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    expo_push_token VARCHAR(255) UNIQUE NOT NULL,
    creado_en DATETIME DEFAULT NOW(),
    actualizado_en DATETIME DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
