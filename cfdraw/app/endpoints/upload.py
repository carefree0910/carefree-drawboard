import json
import logging

from io import BytesIO
from PIL import Image
from typing import Union
from typing import Optional
from fastapi import File
from fastapi import Form
from fastapi import Request
from fastapi import Response
from fastapi import UploadFile
from pydantic import BaseModel
from PIL.PngImagePlugin import PngInfo
from cftool.web import get_responses
from cftool.web import get_image_response_kwargs
from cftool.misc import get_err_msg

from cfdraw import constants
from cfdraw.app.schema import IApp
from cfdraw.utils.server import save_svg
from cfdraw.utils.server import save_image
from cfdraw.utils.server import get_svg_response
from cfdraw.utils.server import get_image_response
from cfdraw.app.endpoints.base import IEndpoint


class ImageDataModel(BaseModel):
    w: int
    h: int
    url: str
    safe: bool = True
    reason: str = ""


class UploadImageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[ImageDataModel]


class FetchImageModel(BaseModel):
    url: str
    jpeg: bool
    return_image: bool = False


class ImageUploader:
    """
    Modify this class if you need to customize image handling processes.
    * `upload_image`: save an image with given `contents`, will be better if `meta` can be stored.
    * `fetch_image`: fetch an image based on `url` and `jpeg` flag.
    """

    @staticmethod
    async def upload_image(
        contents: Union[bytes, Image.Image],
        userJson: str,
        meta: PngInfo,
        base_url: str,
        is_svg: bool,
        audit: bool,
    ) -> ImageDataModel:
        """
        When this method is used in the:
        * `upload_image` endpoint, `contents` will be a `bytes` object.
        * `FieldsMiddleware`, `contents` will be an `Image.Image` object.
        """

        if is_svg:
            if isinstance(contents, Image.Image):
                raise ValueError("svg image should be uploaded as bytes")
            return ImageDataModel(**save_svg(contents.decode(), base_url))
        meta.add_text("userJson", userJson)
        if isinstance(contents, Image.Image):
            image = contents
        else:
            image = Image.open(BytesIO(contents))
        return ImageDataModel(**save_image(image, meta, base_url))

    @staticmethod
    async def fetch_image(data: FetchImageModel) -> Union[Response, Image.Image]:
        file = data.url.split(constants.UPLOAD_IMAGE_FOLDER_NAME)[1][1:]  # remove '/'
        return get_image_response(file, data.jpeg, data.return_image)


def add_upload_image(app: IApp) -> None:
    @app.api.post("/upload_image", responses=get_responses(UploadImageResponse))
    async def upload_image(
        image: UploadFile = File(),
        userId: str = Form(),
        userJson: Optional[str] = Form(None),
        isSVG: str = Form("0"),
        audit: bool = Form(True),
        *,
        request: Request,
    ) -> UploadImageResponse:
        try:
            base_url = str(request.base_url)
            contents = image.file.read()
            if userJson is None:
                userJson = json.dumps(dict(userId=userId))
            is_svg = isSVG == "1"
            args = contents, userJson, PngInfo(), base_url, is_svg, audit
            data = await ImageUploader.upload_image(*args)
        except Exception as err:
            logging.exception("failed to upload image")
            err_msg = get_err_msg(err)
            return UploadImageResponse(success=False, message=err_msg, data=None)
        finally:
            image.file.close()
        return UploadImageResponse(success=True, message="", data=data)

    @app.api.post("/fetch_image", **get_image_response_kwargs())
    async def fetch_image(data: FetchImageModel) -> Response:
        return await ImageUploader.fetch_image(data)

    @app.api.get(
        f"/{constants.UPLOAD_IMAGE_FOLDER_NAME}/{{file}}/",
        **get_image_response_kwargs(),
    )
    async def get_image(file: str, jpeg: bool = False) -> Response:
        if file.endswith(".svg"):
            return get_svg_response(file)
        return get_image_response(file, jpeg)


class UploadEndpoint(IEndpoint):
    def register(self) -> None:
        add_upload_image(self.app)


__all__ = [
    "UploadEndpoint",
]
