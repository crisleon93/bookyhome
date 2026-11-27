# Runbooks — BookyHome

Los runbooks son procedimientos paso a paso para responder a alertas críticas del sistema.
Están escritos para que cualquier persona de soporte N2 los siga sin conocimiento previo del código.

## Índice de Procedimientos

| Procedimiento / Runbook | Estado Normal | Evento de Contingencia | Prioridad |
|---|---|---|---|
| [salud-en-rojo.md](salud-en-rojo.md) | 🟢 **Salud API (HTTP 200 OK)** | Monitor cambia a 🔴 DOWN si la BD o API caen | P1 |
| [respaldo-diario-sin-latido.md](respaldo-diario-sin-latido.md) | 🟢 **Respaldo diario activo** | Monitor cambia a 🔴 DOWN si pasan >25 h sin latido | P2 |

## Cómo usar un runbook

1. Recibir la alerta por el canal de operaciones configurado (Telegram o email).
2. Identificar el monitor afectado.
3. Abrir el runbook correspondiente.
4. Seguir el árbol de decisión de arriba a abajo.
5. Ejecutar los comandos en el orden indicado.
6. Verificar resolución (sección final de cada runbook).
7. Registrar el incidente en la tabla al final del runbook.

## Herramientas necesarias

- Acceso SSH al servidor (`ssh <usuario-de-guardia>@<servidor>`)
- Docker CLI instalado en el servidor
- Acceso a Uptime Kuma (http://`<ip-vm-kuma>`:3001)
- Acceso al canal de operaciones configurado

## Contactos de escalado

| Nivel | Rol | Contacto | Disponibilidad |
|---|---|---|---|
| N2 | Operaciones de guardia | Canal de guardia configurado | Según la rotación vigente |
| N3 | Responsable del servicio | Canal de escalado configurado | 24/7 para P1 |
