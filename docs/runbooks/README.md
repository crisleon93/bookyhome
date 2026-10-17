# Runbooks — BookyHome

Los runbooks son procedimientos paso a paso para responder a alertas críticas del sistema.
Están escritos para que cualquier persona de soporte N2 los siga sin conocimiento previo del código.

## Índice

| Runbook | Alerta que lo activa | Prioridad |
|---|---|---|
| [salud-en-rojo.md](salud-en-rojo.md) | Monitor **Salud API** 🔴 DOWN en Uptime Kuma | P1 |
| [respaldo-diario-sin-latido.md](respaldo-diario-sin-latido.md) | Monitor **Respaldo diario** 🔴 DOWN en Uptime Kuma | P2 |

## Cómo usar un runbook

1. Recibir la alerta por Telegram (grupo BookyHome-Ops) o email.
2. Identificar el monitor afectado.
3. Abrir el runbook correspondiente.
4. Seguir el árbol de decisión de arriba a abajo.
5. Ejecutar los comandos en el orden indicado.
6. Verificar resolución (sección final de cada runbook).
7. Registrar el incidente en la tabla al final del runbook.

## Herramientas necesarias

- Acceso SSH al servidor (`ssh ana@bookyhome-server` o `ssh luis@bookyhome-server`)
- Docker CLI instalado en el servidor
- Acceso a Uptime Kuma (http://`<ip-vm-kuma>`:3001)
- Telegram con acceso al grupo BookyHome-Ops

## Contactos de escalado

| Nivel | Persona | Contacto | Disponibilidad |
|---|---|---|---|
| N2 | `luis` (operador) | Telegram @luis_bookyhome | Lunes–viernes 8:00–18:00 |
| N3 | `ana` (administradora) | Telegram @ana_bookyhome | 24/7 para P1 |
