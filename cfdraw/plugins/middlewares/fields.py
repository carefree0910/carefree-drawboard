from typing import List
from typing import Union
from PIL.Image import Image

from cfdraw.utils.server import upload_image
from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleWare
from cfdraw.schema.plugins import IPluginResponse


class FieldsMiddleWare(IMiddleWare):
    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.HTTP_FIELDS]

    async def process(
        self,
        response: Union[str, List[str], Image, List[Image]],
    ) -> IPluginResponse:
        if not isinstance(response, list):
            response = [response]
        if isinstance(response[0], str):
            return IPluginResponse(
                success=True,
                message="",
                data=dict(type="text", value=response),
            )
        return IPluginResponse(
            success=True,
            message="",
            data=dict(type="image", value=[upload_image(image) for image in response]),
        )


__all__ = [
    "FieldsMiddleWare",
]
