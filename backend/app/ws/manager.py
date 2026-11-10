import asyncio
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Guarda las conexiones WS activas por id_usuario (soporta multi-dispositivo:
    ej. vendedor conectado desde la app y desde la web al mismo tiempo)."""

    def __init__(self):
        self.conexiones_activas: Dict[int, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, id_usuario: int, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.conexiones_activas.setdefault(id_usuario, []).append(websocket)

    async def disconnect(self, id_usuario: int, websocket: WebSocket):
        async with self._lock:
            conexiones = self.conexiones_activas.get(id_usuario)
            if conexiones and websocket in conexiones:
                conexiones.remove(websocket)
                if not conexiones:
                    del self.conexiones_activas[id_usuario]

    def esta_conectado(self, id_usuario: int) -> bool:
        return bool(self.conexiones_activas.get(id_usuario))

    async def enviar_a_usuario(self, id_usuario: int, data: dict) -> bool:
        """Envía a todas las conexiones activas del usuario.
        Devuelve True si al menos una conexión lo recibió (o sea, está 'en vivo')."""
        conexiones = list(self.conexiones_activas.get(id_usuario, []))
        if not conexiones:
            return False
        entregado = False
        rotas = []
        for ws in conexiones:
            try:
                await ws.send_json(data)
                entregado = True
            except Exception:
                rotas.append(ws)
        if rotas:
            async with self._lock:
                for ws in rotas:
                    if ws in self.conexiones_activas.get(id_usuario, []):
                        self.conexiones_activas[id_usuario].remove(ws)
        return entregado


manager = ConnectionManager()