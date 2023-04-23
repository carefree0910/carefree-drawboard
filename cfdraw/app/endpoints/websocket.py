import json
import asyncio
import logging

from asyncio import Event
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from cfdraw import constants
from cfdraw.app.schema import IApp
from cfdraw.app.schema import IRequestQueueData
from cfdraw.utils.server import get_err_msg
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.plugins.base import ISocketPlugin
from cfdraw.app.endpoints.base import IEndpoint


def add_websocket(app: IApp) -> None:
    @app.api.websocket(str(constants.Endpoint.WEBSOCKET))
    async def websocket(websocket: WebSocket) -> None:
        async def on_failed(e: Exception, hash: str) -> None:
            logging.exception(e)
            await websocket.send_text(
                json.dumps(
                    ISocketMessage.make_exception(
                        hash,
                        message=f"Invalid data: {get_err_msg(e)}",
                    ).dict()
                )
            )

        async def send_text(data: ISocketMessage) -> None:
            await websocket.send_text(json.dumps(data.dict()))

        await websocket.accept()
        while True:
            try:
                target_plugin = None
                raw_data = await websocket.receive_text()
                data = ISocketRequest(**json.loads(raw_data))
                if data.isInternal:
                    identifier = data.identifier
                    target_plugin = app.internal_plugins.make(identifier)
                else:
                    identifier = data.identifier.split(".", 1)[0]  # remove hash
                    target_plugin = app.plugins.make(identifier)
                if target_plugin is not None:
                    # `send_text` should be handled by the plugin itself, or by
                    # the `SocketMessageMiddleWare` which will provide a default handling
                    target_plugin.send_text = send_text
                    queue_data = IRequestQueueData(data, target_plugin, Event())
                    uid = app.request_queue.push(queue_data, send_text)
                    asyncio.create_task(app.request_queue.wait(data.userId, uid))
                else:
                    plugin_str = "internal plugin" if data.isInternal else "plugin"
                    await send_text(
                        ISocketMessage.make_exception(
                            data.hash,
                            (
                                f"incoming message subscribed {plugin_str} '{identifier}', "
                                "but it is not found"
                            ),
                        )
                    )
            except WebSocketDisconnect:
                break
            except Exception as e:
                await on_failed(e, data.hash)
            finally:
                del target_plugin


class WebsocketEndpoint(IEndpoint):
    def register(self) -> None:
        add_websocket(self.app)


__all__ = [
    "WebsocketEndpoint",
]
