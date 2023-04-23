from typing import List

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import ISocketMiddleWare


class SendSocketMessageMiddleWare(ISocketMiddleWare):
    hash: str

    @property
    def subscriptions(self) -> List[PluginType]:
        return [
            PluginType.TEXT_AREA,
            PluginType.QA,
            PluginType.FIELDS,
            PluginType._INTERNAL,
        ]

    @property
    def can_handle_message(self) -> bool:
        return True

    async def process(self, response: ISocketMessage) -> ISocketMessage:
        await self.send_text(response)
        return response


__all__ = [
    "SendSocketMessageMiddleWare",
]
