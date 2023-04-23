from typing import List

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import ISocketMiddleWare


class TextAreaMiddleWare(ISocketMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.TEXT_AREA, PluginType.QA]

    async def process(self, response: str) -> ISocketMessage:
        return self.make_success(dict(text=response))


__all__ = [
    "TextAreaMiddleWare",
]
