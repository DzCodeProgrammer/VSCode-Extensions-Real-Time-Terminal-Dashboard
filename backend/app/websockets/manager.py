from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass(slots=True)
class WebSocketManager:
    """Tracks active dashboard websocket clients."""

    clients: set[WebSocket] = field(default_factory=set)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.clients.discard(websocket)

    async def broadcast_json(self, payload: dict) -> None:
        disconnected: list[WebSocket] = []
        for client in self.clients:
            try:
                await client.send_json(payload)
            except RuntimeError:
                disconnected.append(client)

        for client in disconnected:
            self.disconnect(client)


websocket_manager = WebSocketManager()
