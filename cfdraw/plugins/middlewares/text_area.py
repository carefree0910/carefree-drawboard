from typing import List
from typing import Union

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleWare
from cfdraw.schema.plugins import IHttpPluginResponse


class TextAreaMiddleWare(IMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.HTTP_TEXT_AREA, PluginType.HTTP_QA]

    def process(self, response: Union[str, IHttpPluginResponse]) -> IHttpPluginResponse:
        if isinstance(response, IHttpPluginResponse):
            return response
        return IHttpPluginResponse(success=True, message="", data=dict(text=response))


__all__ = [
    "TextAreaMiddleWare",
]
