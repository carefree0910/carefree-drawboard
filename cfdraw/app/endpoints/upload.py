from io import BytesIO
from PIL import Image
from typing import Optional
from fastapi import File
from fastapi import Form
from fastapi import Response
from fastapi import UploadFile
from pydantic import BaseModel
from PIL.PngImagePlugin import PngInfo

from cfdraw import constants
from cfdraw.utils import server
from cfdraw.app.schema import IApp
from cfdraw.utils.misc import get_err_msg
from cfdraw.utils.server import get_responses
from cfdraw.utils.server import get_image_response_kwargs
from cfdraw.app.endpoints.base import IEndpoint


class ImageDataModel(BaseModel):
    w: int
    h: int
    url: str


class UploadImageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[ImageDataModel]


class FetchImageModel(BaseModel):
    url: str
    jpeg: bool


class ImageUploader:
    """
    Modify this class if you need to customize image handling processes.
    * `upload_image`: save an image with given `contents`, will be better if `meta` can be stored.
    * `fetch_image`: fetch an image based on `url` and `jpeg` flag.
    """

    @staticmethod
    def upload_image(contents: bytes, meta: PngInfo) -> ImageDataModel:
        loaded_image = Image.open(BytesIO(contents))
        res = server.upload_image(loaded_image, meta)
        return ImageDataModel(**res)

    @staticmethod
    def fetch_image(data: FetchImageModel) -> Response:
        file = data.url.split(constants.UPLOAD_IMAGE_FOLDER_NAME)[1][1:]  # remove '/'
        return server.get_image_response(file, data.jpeg)


def add_upload_image(app: IApp) -> None:
    @app.api.post("/upload_image", responses=get_responses(UploadImageResponse))
    def upload_image(
        image: UploadFile = File(),
        userId: str = Form(),
    ) -> UploadImageResponse:
        try:
            contents = image.file.read()
            meta = PngInfo()
            meta.add_text("userId", userId)
            data = ImageUploader.upload_image(contents, meta)
        except Exception as err:
            err_msg = get_err_msg(err)
            return UploadImageResponse(success=False, message=err_msg, data=None)
        finally:
            image.file.close()
        return UploadImageResponse(success=True, message="", data=data)

    @app.api.post("/fetch_image", **get_image_response_kwargs())
    async def fetch_image(data: FetchImageModel) -> Response:
        return ImageUploader.fetch_image(data)

    @app.api.get(
        f"/{constants.UPLOAD_IMAGE_FOLDER_NAME}/{{file}}/",
        **get_image_response_kwargs(),
    )
    async def get_image(file: str, jpeg: bool = False) -> Response:
        return server.get_image_response(file, jpeg)


class UploadEndpoint(IEndpoint):
    def register(self) -> None:
        add_upload_image(self.app)


__all__ = [
    "UploadEndpoint",
]
