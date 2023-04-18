from typing import Union
from tornado import websocket
from tornado.ioloop import IOLoop

from cfdraw.config import get_config
from cfdraw.utils.server import get_err_msg


class SocketProxyHandler(websocket.WebSocketHandler):
    def initialize(self) -> None:
        self.config = get_config()

    async def open(self) -> None:
        self.ws = None
        ws_url = f"ws://localhost:{self.config.backend_port}{self.request.uri}"
        try:
            self.ws = await websocket.websocket_connect(ws_url)
            IOLoop.current().spawn_callback(self.ws_listen)
        except Exception as e:
            self.close(reason=f"Failed to proxy WebSocket: {get_err_msg(e)}")

    async def on_message(self, message: Union[str, bytes]) -> None:
        if self.ws:
            await self.ws.write_message(message)

    def on_close(self) -> None:
        if self.ws:
            self.ws.close()

    async def ws_listen(self) -> None:
        try:
            assert self.ws is not None, "`ws` is not ready"
            while True:
                message = await self.ws.read_message()
                if message is None:
                    self.close(reason="Proxy WebSocket closed")
                    break
                await self.write_message(message)
        except Exception as e:
            self.close(reason=f"Error reading from proxy WebSocket: {e}")


__all__ = [
    "SocketProxyHandler",
]
