import time
import asyncio

from typing import List
from typing import Union
from typing import Optional
from PIL.Image import Image
from PIL.PngImagePlugin import PngInfo

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleware
from cfdraw.schema.plugins import Subscription
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.app.endpoints.upload import ImageUploader


class ResponseMiddleware(IMiddleware):
    @property
    def subscriptions(self) -> Union[List[PluginType], Subscription]:
        return Subscription.ALL

    async def before(self, request: ISocketRequest) -> None:
        await super().before(request)
        self.request = request

    async def process(
        self,
        response: Optional[Union[str, List[str], Image, List[Image]]],
    ) -> Optional[ISocketMessage]:
        if response is None:
            return None
        if not isinstance(response, list):
            response = [response]
        if isinstance(response[0], str):
            return self.make_success(
                dict(
                    type="text",
                    value=[dict(text=text, safe=True, reason="") for text in response],
                )
            )
        meta = PngInfo()
        meta.add_text("request", self.request.json())
        t = time.time()
        audit = self.plugin.image_should_audit
        upload = ImageUploader.upload_image
        base_url = self.request.baseURL
        user_json = self.request.get_user_json()
        args = user_json, meta, base_url, False, audit
        futures = [upload(im, *args) for im in response]
        urls = [data.dict() for data in await asyncio.gather(*futures)]
        self.plugin.elapsed_times.upload = time.time() - t
        return self.make_success(dict(type="image", value=urls))


__all__ = [
    "ResponseMiddleware",
]
