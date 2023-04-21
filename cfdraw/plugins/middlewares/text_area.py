from typing import List
from typing import Union

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleWare
from cfdraw.schema.plugins import IPluginResponse


class TextAreaMiddleWare(IMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.HTTP_TEXT_AREA, PluginType.HTTP_QA]

    async def process(self, response: str) -> IPluginResponse:
        return IPluginResponse(success=True, message="", data=dict(text=response))


__all__ = [
    "TextAreaMiddleWare",
]
