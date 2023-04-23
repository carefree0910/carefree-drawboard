from typing import List

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.schema.plugins import ISocketMiddleWare


class SocketMessageMiddleWare(ISocketMiddleWare):
    hash: str

    @property
    def subscriptions(self) -> List[PluginType]:
        return [
            PluginType.TEXT_AREA,
            PluginType.QA,
            PluginType.SOCKET_FIELDS,
            PluginType._INTERNAL,
        ]

    @property
    def can_handle_response(self) -> bool:
        return True

    async def before(self, request: ISocketRequest) -> None:
        self.hash = request.hash

    async def process(self, response: IPluginResponse) -> IPluginResponse:
        await self.send_text(ISocketMessage.from_response(self.hash, response))
        return response


__all__ = [
    "SocketMessageMiddleWare",
]
