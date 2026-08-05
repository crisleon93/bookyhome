import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def enviar_push_expo(tokens: list[str], titulo: str, cuerpo: str, data: dict | None = None):
    """Envía notificación push a uno o varios tokens Expo. No lanza excepción si falla."""
    if not tokens:
        return

    mensajes = [
        {
            "to": token,
            "sound": "default",
            "title": titulo,
            "body": cuerpo,
            "data": data or {},
        }
        for token in tokens
    ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=mensajes,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            )
            return resp.json()
    except Exception as e:
        # No queremos que un fallo de push tumbe el envío del mensaje de chat
        print(f"Error enviando push: {e}")
        return None