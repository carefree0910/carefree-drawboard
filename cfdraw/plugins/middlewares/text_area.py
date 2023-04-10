from typing import List
from typing import Union

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleWare
from cfdraw.schema.plugins import HttpTextAreaModel
from cfdraw.schema.plugins import HttpTextAreaResponse


TTextAreaResponse = Union[str, HttpTextAreaResponse]


class TextAreaMiddleWare(IMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.HTTP_TEXT_AREA, PluginType.HTTP_QA]

    def process(self, response: TTextAreaResponse) -> HttpTextAreaResponse:
        if isinstance(response, HttpTextAreaResponse):
            return response
        return HttpTextAreaResponse(
            success=True,
            message="",
            data=HttpTextAreaModel(text=response),
        )


__all__ = [
    "TextAreaMiddleWare",
]
