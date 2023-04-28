from io import BytesIO
from PIL import Image
from typing import Optional
from fastapi import File
from fastapi import Response
from fastapi import UploadFile
from pydantic import BaseModel

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


def add_upload_image(app: IApp) -> None:
    @app.api.post("/upload_image", responses=get_responses(UploadImageResponse))
    def upload_image(image: UploadFile = File(...)) -> UploadImageResponse:
        try:
            contents = image.file.read()
            loaded_image = Image.open(BytesIO(contents))
            res = server.upload_image(loaded_image)
        except Exception as err:
            err_msg = get_err_msg(err)
            return UploadImageResponse(success=False, message=err_msg, data=None)
        finally:
            image.file.close()
        return UploadImageResponse(
            success=True,
            message="",
            data=ImageDataModel(**res),
        )

    @app.api.post("/fetch_image", **get_image_response_kwargs())
    async def fetch_image(data: FetchImageModel) -> Response:
        file = data.url.split(constants.UPLOAD_IMAGE_FOLDER_NAME)[1][1:]  # remove '/'
        return server.get_image_response(file, data.jpeg)

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
