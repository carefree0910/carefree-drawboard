import json
import asyncio
import logging

from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from cftool.misc import get_err_msg
from cftool.misc import print_error
from starlette.websockets import WebSocketState

from cfdraw import constants
from cfdraw.app.schema import IApp
from cfdraw.app.schema import IRequestQueueData
from cfdraw.utils.misc import offload
from cfdraw.schema.plugins import ElapsedTimes
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.schema.plugins import ISocketMessage
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

        async def send_message(data: ISocketMessage) -> bool:
            if websocket.client_state == WebSocketState.DISCONNECTED:
                return False
            await websocket.send_text(json.dumps(data.dict()))
            return True

        await websocket.accept()
        while True:
            raw_data = data = None
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
                    # `send_message` should be handled by the plugin itself, or by
                    # the `SendSocketMessageMiddleware` which will provide a default handling
                    target_plugin.task_hash = data.hash
                    target_plugin.send_message = send_message
                    target_plugin.elapsed_times = ElapsedTimes()
                    if data.isInternal:
                        target_plugin.elapsed_times.start()
                        await offload(target_plugin(data))
                    else:
                        queue_data = IRequestQueueData(data, target_plugin)
                        uid = app.request_queue.push(queue_data, send_message)
                        asyncio.create_task(app.request_queue.wait(data.userId, uid))
                else:
                    plugin_str = "internal plugin" if data.isInternal else "plugin"
                    message = (
                        f"incoming message subscribed {plugin_str} '{identifier}', "
                        "but it is not found"
                    )
                    exception = ISocketMessage.make_exception(data.hash, message)
                    if not await send_message(exception):
                        print_error(f"[websocket.loop] {message}")
            except WebSocketDisconnect:
                break
            except Exception as e:
                if data is not None:
                    req_hash = data.hash
                elif raw_data is not None and isinstance(raw_data, dict):
                    req_hash = raw_data.get("hash", "unknown")
                else:
                    req_hash = "unknown"
                await on_failed(e, req_hash)
            finally:
                del target_plugin


class WebsocketEndpoint(IEndpoint):
    def register(self) -> None:
        add_websocket(self.app)


__all__ = [
    "WebsocketEndpoint",
]
