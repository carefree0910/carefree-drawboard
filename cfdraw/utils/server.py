import socket
import logging

import numpy as np

from io import BytesIO
from PIL import Image
from typing import Any
from typing import Dict
from typing import Type
from typing import Optional
from fastapi import Response
from fastapi import HTTPException
from pydantic import BaseModel
from PIL.PngImagePlugin import PngInfo
from cftool.cv import to_rgb
from cftool.cv import np_to_bytes
from cftool.misc import random_hash

from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.utils.misc import get_err_msg


class RuntimeError(BaseModel):
    detail: str

    class Config:
        schema_extra = {
            "example": {"detail": "RuntimeError occurred."},
        }


def get_ip() -> str:
    return socket.gethostbyname(socket.gethostname())


def get_responses(
    success_model: Type[BaseModel],
    *,
    json_example: Optional[Dict[str, Any]] = None,
) -> Dict[int, Dict[str, Type]]:
    success_response: Dict[str, Any] = {"model": success_model}
    if json_example is not None:
        content = success_response["content"] = {}
        json_field = content["application/json"] = {}
        json_field["example"] = json_example
    return {
        200: success_response,
        constants.ERR_CODE: {"model": RuntimeError},
    }


def get_image_response_kwargs() -> Dict[str, Any]:
    example = "\\x89PNG\\r\\n\\x1a\\n\\x00\\x00\\x00\\rIHDR\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x01\\x08\\x00\\x00\\x00\\x00:~\\x9bU\\x00\\x00\\x00\\nIDATx\\x9cc`\\x00\\x00\\x00\\x02\\x00\\x01H\\xaf\\xa4q\\x00\\x00\\x00\\x00IEND\\xaeB`\\x82"
    responses = {
        200: {"content": {"image/png": {"example": example}}},
        constants.ERR_CODE: {"model": RuntimeError},
    }
    description = """
Bytes of the output image.
+ When using `requests` in `Python`, you can get the `bytes` with `res.content`.
+ When using `fetch` in `JavaScript`, you can get the `Blob` with `await res.blob()`.
"""
    return dict(
        responses=responses,
        response_class=Response(content=b""),
        response_description=description,
    )


def raise_err(err: Exception) -> None:
    logging.exception(err)
    raise HTTPException(status_code=constants.ERR_CODE, detail=get_err_msg(err))


def save_image(image: Image.Image, meta: Optional[PngInfo] = None) -> Dict[str, Any]:
    w, h = image.size
    config = get_config()
    path = config.upload_image_folder / f"{random_hash()}.png"
    image.save(path, pnginfo=meta)
    url = f"{config.api_url}/{path.relative_to(config.upload_root_path).as_posix()}"
    return dict(w=w, h=h, url=url)


def get_image(file: str, jpeg: bool = False) -> Image.Image:
    config = get_config()
    try:
        image = Image.open(config.upload_image_folder / file)
        if not jpeg:
            return image
        with BytesIO() as f:
            to_rgb(image).save(f, format="JPEG", quality=95)
            f.seek(0)
            image = Image.open(f)
            image.load()
            return image
    except Exception as err:
        raise_err(err)


def get_image_response(file: str, jpeg: bool = False) -> Response:
    config = get_config()
    try:
        image = Image.open(config.upload_image_folder / file)
        if not jpeg:
            content = np_to_bytes(np.array(image))
        else:
            with BytesIO() as f:
                to_rgb(image).save(f, format="JPEG", quality=95)
                f.seek(0)
                content = f.read()
        return Response(content=content, media_type="image/png")
    except Exception as err:
        raise_err(err)
