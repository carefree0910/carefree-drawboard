import json
import logging

from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from cfdraw import constants
from cfdraw.app.schema import IApp
from cfdraw.utils.server import get_err_msg
from cfdraw.schema.plugins import IPluginRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.plugins.base import ISocketPlugin


def add_websocket(app: IApp) -> None:
    @app.api.websocket(str(constants.Endpoint.WEBSOCKET))
    async def websocket(websocket: WebSocket) -> None:
        async def on_failed(e: Exception) -> None:
            logging.exception(e)
            response = IPluginResponse(
                success=False,
                message=f"Invalid data: {get_err_msg(e)}",
                data={},
            )
            await websocket.send_text(json.dumps(response.dict()))

        async def sent_text(data: ISocketMessage) -> None:
            await websocket.send_text(json.dumps(data.dict()))

        await websocket.accept()
        while True:
            try:
                raw_data = await websocket.receive_text()
                data = IPluginRequest(**json.loads(raw_data))
                if data.isInternal:
                    identifier = data.identifier
                    target_plugin = app.internal_plugins.get(identifier)
                else:
                    identifier = data.identifier.split(".", 1)[-1]  # remove hash
                    target_plugin = app.plugins.get(identifier)
                if target_plugin is None:
                    plugin_str = "internal plugin" if data.isInternal else "plugin"
                    response = IPluginResponse(
                        success=False,
                        message=(
                            f"incoming message subscribed {plugin_str} '{identifier}', "
                            "but it is not found"
                        ),
                        data={},
                    )
                elif not isinstance(target_plugin, ISocketPlugin):
                    response = IPluginResponse(
                        success=False,
                        message=(
                            f"incoming message subscribed plugin '{identifier}', "
                            "but it is not a socket plugin"
                        ),
                        data={},
                    )
                else:
                    target_plugin.send_text = sent_text
                    response = await target_plugin(data)
                await sent_text(response)
            except WebSocketDisconnect:
                break
            except Exception as e:
                await on_failed(e)


__all__ = [
    "add_websocket",
]
