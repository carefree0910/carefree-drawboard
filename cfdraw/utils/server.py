import sys
import logging

from PIL import Image
from typing import Any
from typing import Dict
from typing import Type
from typing import Optional
from fastapi import Response
from fastapi import HTTPException
from pydantic import BaseModel
from cftool.misc import random_hash

from cfdraw import constants
from cfdraw.config import get_config


class RuntimeError(BaseModel):
    detail: str

    class Config:
        schema_extra = {
            "example": {"detail": "RuntimeError occurred."},
        }


def get_responses(
    success_model: Type[BaseModel],
    *,
    json_example: Optional[Dict[str, Any]] = None,
) -> Dict[int, Dict[str, Type]]:
    success_response = {"model": success_model}
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


def get_err_msg(err: Exception) -> str:
    return " | ".join(map(repr, sys.exc_info()[:2] + (str(err),)))


def raise_err(err: Exception) -> None:
    logging.exception(err)
    raise HTTPException(status_code=constants.ERR_CODE, detail=get_err_msg(err))


def upload_image(image: Image.Image) -> Dict[str, Any]:
    w, h = image.size
    path = constants.UPLOAD_FOLDER / f"{random_hash()}.png"
    image.save(path)
    url_path = path.relative_to(constants.PARENT).as_posix()
    url = f"{get_config().api_url}/{url_path}"
    return dict(w=w, h=h, url=url)
