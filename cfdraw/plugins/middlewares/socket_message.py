from typing import List

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.schema.plugins import ISocketMiddleWare


class SocketMessageMiddleWare(ISocketMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.SOCKET_FIELDS, PluginType._INTERNAL]

    @property
    def can_handle_response(self) -> bool:
        return True

    async def process(self, response: IPluginResponse) -> IPluginResponse:
        await self.send_text(ISocketMessage.from_response(response))
        return response


__all__ = [
    "SocketMessageMiddleWare",
]
