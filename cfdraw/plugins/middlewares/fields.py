from typing import List
from typing import Union
from PIL.Image import Image

from cfdraw.utils.server import upload_image
from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleWare
from cfdraw.schema.plugins import ISocketMessage


class FieldsMiddleWare(IMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.FIELDS]

    async def process(
        self,
        response: Union[str, List[str], Image, List[Image]],
    ) -> ISocketMessage:
        if not isinstance(response, list):
            response = [response]
        if isinstance(response[0], str):
            return self.make_success(dict(type="text", value=response))
        urls = [upload_image(image) for image in response]
        return self.make_success(dict(type="image", value=urls))


__all__ = [
    "FieldsMiddleWare",
]
