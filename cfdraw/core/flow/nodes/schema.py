import json
import websockets

from PIL import Image
from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import Union
from typing import Optional
from typing import Protocol
from aiohttp import ClientSession
from pydantic import Field
from pydantic import BaseModel
from dataclasses import dataclass
from pydantic_core import core_schema

from ..core import Hook
from ..core import Node
from ..core import Schema
from ...toolkit.cv import to_base64
from ...toolkit.web import download_raw_with_retry
from ...toolkit.web import download_image_with_retry


HTTP_SESSION_KEY = "$http_session$"


# enums / data models


class DocEnum(Enum):
    """A class that tells use to include it in the documentation"""


class DocModel(BaseModel):
    """A class that tells use to include it in the documentation"""


class TextModel(DocModel):
    text: str = Field(..., description="The text.")


class ImageField(Image.Image):
    @classmethod
    def __get_pydantic_core_schema__(cls, *args: Any) -> core_schema.CoreSchema:
        return core_schema.with_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v: Any, info: core_schema.ValidationInfo) -> Image.Image:
        if isinstance(v, Image.Image):
            return v
        raise ValueError("Value must be a PIL Image")


TImage = Union[str, ImageField]


class ImageModel(DocModel):
    url: TImage = Field(..., description="The url / PIL.Image instance of the image.")


class ImageAPIOuput(DocModel):
    image: str = Field(..., description="The base64 encoded image.")


class EmptyOutput(BaseModel):
    pass


# hooks / node interfaces


class HttpSessionHook(Hook):
    @classmethod
    async def initialize(cls, shared_pool: Dict[str, Any]) -> None:
        if HTTP_SESSION_KEY not in shared_pool:
            shared_pool[HTTP_SESSION_KEY] = ClientSession()

    @classmethod
    async def cleanup(cls, shared_pool: Dict[str, Any]) -> None:
        http_session = shared_pool.pop(HTTP_SESSION_KEY, None)
        if http_session is not None:
            if not isinstance(http_session, ClientSession):
                raise TypeError(f"invalid http session type: {type(http_session)}")
            await http_session.close()


class IWithHttpSessionNode(Node):
    """
    node interface which requires `ClientSession` in the `shared_pool`.

    Notes
    -----
    - This interface provides `http_session` to get the `ClientSession` from the `shared_pool`.
    - This interface provides `download_raw` and `download_image` to download data from the internet.

    """

    @classmethod
    def get_hooks(cls) -> List[Type[Hook]]:
        return [HttpSessionHook]

    @property
    def http_session(self) -> ClientSession:
        session = self.shared_pool.get(HTTP_SESSION_KEY)
        if session is None:
            raise ValueError(
                f"`{HTTP_SESSION_KEY}` should be provided in the `shared_pool` "
                f"for `{self.__class__.__name__}`"
            )
        if not isinstance(session, ClientSession):
            raise TypeError(f"invalid http session type: {type(session)}")
        return session

    async def download_raw(self, url: str) -> bytes:
        return await download_raw_with_retry(self.http_session, url)

    async def download_image(self, url: str) -> Image.Image:
        return await download_image_with_retry(self.http_session, url)


class IHandleMessage(Protocol):
    async def __call__(self, raw_message: websockets.Data) -> bool:
        """
        Handle the message and return whether to terminate the websocket.

        Parameters
        ----------
        raw_message: websockets.Data
            The raw message.

        Returns
        -------
        bool
            Whether to terminate the websocket (return `True` to terminate).
        """


class IWithWebsocketNode(Node):
    async def connect(
        self,
        url: str,
        *,
        handler: IHandleMessage,
        send_data: Optional[Dict[str, Any]] = None,
        headers: Optional[websockets.HeadersLike] = None,
        **kwargs: Any,
    ) -> None:
        kwargs["extra_headers"] = headers
        async with websockets.connect(url, **kwargs) as websocket:
            if send_data is not None:
                await websocket.send(json.dumps(send_data))
            async for raw_message in websocket:
                if await handler(raw_message):
                    break


class IWithImageNode(IWithHttpSessionNode):
    """
    node interface which (may) have image(s) as input. This is helpful for crafting image processing nodes.

    Notes
    -----
    - This interface provides `get_image_from` to get the image from the given field.
      - If the field is a url, it will be downloaded.
      - The field can also be `PIL.Image` directly, since it might be injected by
        other nodes.

    """

    async def fetch_image(self, tag: str, image: TImage) -> Image.Image:
        if isinstance(image, str):
            image = await self.download_image(image)
        elif not isinstance(image, Image.Image):
            raise ValueError(f"`{tag}` should be a `PIL.Image` or a url")
        return image

    async def get_image_from(self, field: str) -> Image.Image:
        image = self.data[field]
        return await self.fetch_image(field, image)


class IImageNode(IWithImageNode):
    """
    Image node interface. This is helpful for crafting image processing nodes.

    Notes
    -----
    - This interface assumes the output to be like `{"image": PIL.Image}`.

    """

    @classmethod
    def get_schema(cls) -> Schema:
        return Schema(
            ImageModel,
            api_output_model=ImageAPIOuput,
            output_names=["image"],
        )

    async def get_api_response(self, results: Dict[str, Image.Image]) -> Dict[str, str]:
        return {"image": to_base64(results["image"])}


@dataclass
class ICUDANode(Node):
    """
    CUDA node interface. This is helpful when creating nodes for modern AI models.

    Notes
    -----
    - CUDA executions should be 'offloaded' to avoid blocking other async executions.
    - CUDA executions should be 'locked' to avoid CUDA issues.
    """

    offload: bool = True
    lock_key: str = "$cuda$"


__all__ = [
    "DocEnum",
    "DocModel",
    "TextModel",
    "TImage",
    "ImageModel",
    "ImageAPIOuput",
    "EmptyOutput",
    "HttpSessionHook",
    "IWithHttpSessionNode",
    "IWithWebsocketNode",
    "IWithImageNode",
    "IImageNode",
    "ICUDANode",
]
