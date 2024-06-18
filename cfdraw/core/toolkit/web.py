import json
import time
import logging

from io import BytesIO
from typing import Any
from typing import Dict
from typing import Type
from typing import TypeVar
from typing import Callable
from typing import Optional
from typing import Awaitable
from typing import TYPE_CHECKING
from pydantic import BaseModel
from pydantic import ConfigDict

from .misc import get_err_msg
from .constants import WEB_ERR_CODE

if TYPE_CHECKING:
    from PIL import Image
    from aiohttp import ClientSession


TResponse = TypeVar("TResponse")


class RuntimeError(BaseModel):
    detail: str

    model_config = ConfigDict(
        json_schema_extra={"example": {"detail": "RuntimeError occurred."}}
    )


def get_ip() -> str:
    import socket

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
        WEB_ERR_CODE: {"model": RuntimeError},
    }


def get_image_response_kwargs() -> Dict[str, Any]:
    from fastapi import Response

    example = "\\x89PNG\\r\\n\\x1a\\n\\x00\\x00\\x00\\rIHDR\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x01\\x08\\x00\\x00\\x00\\x00:~\\x9bU\\x00\\x00\\x00\\nIDATx\\x9cc`\\x00\\x00\\x00\\x02\\x00\\x01H\\xaf\\xa4q\\x00\\x00\\x00\\x00IEND\\xaeB`\\x82"
    responses = {
        200: {"content": {"image/png": {"example": example}}},
        WEB_ERR_CODE: {"model": RuntimeError},
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
    from fastapi import HTTPException

    logging.exception(err)
    raise HTTPException(status_code=WEB_ERR_CODE, detail=get_err_msg(err))


async def get(url: str, session: "ClientSession", **kwargs: Any) -> bytes:
    async with session.get(url, **kwargs) as response:
        return await response.read()


async def post(
    url: str,
    json: Dict[str, Any],
    session: "ClientSession",
    **kwargs: Any,
) -> Dict[str, Any]:
    async with session.post(url, json=json, **kwargs) as response:
        return await response.json()


def log_endpoint(endpoint: str, data: BaseModel) -> None:
    msg = f"{endpoint} endpoint entered with kwargs : {json.dumps(data.model_dump(), ensure_ascii=False)}"
    logging.debug(msg)


def log_times(endpoint: str, times: Dict[str, float]) -> None:
    times["__total__"] = sum(times.values())
    logging.debug(f"elapsed time of endpoint {endpoint} : {json.dumps(times)}")


async def download_raw(session: "ClientSession", url: str, **kw: Any) -> bytes:
    try:
        return await get(url, session, **kw)
    except Exception:
        import requests

        return requests.get(url, **kw).content


async def download_image(
    session: "ClientSession", url: str, **kw: Any
) -> "Image.Image":
    from PIL import Image
    from PIL import ImageOps

    raw_data = None
    try:
        raw_data = await download_raw(session, url, **kw)
        image = Image.open(BytesIO(raw_data))
        try:
            image = ImageOps.exif_transpose(image)
        finally:
            return image
    except Exception as err:
        if raw_data is None:
            msg = f"raw | None | err | {err}"
        else:
            try:
                msg = raw_data.decode("utf-8")
            except:
                msg = f"raw | {raw_data[:20]!r} | err | {err}"
        raise ValueError(msg)


async def retry_with(
    download_fn: Callable[["ClientSession", str], Awaitable[TResponse]],
    session: "ClientSession",
    url: str,
    retry: int = 3,
    interval: int = 1,
    **kw: Any,
) -> TResponse:
    msg = ""
    for i in range(retry):
        try:
            res = await download_fn(session, url, **kw)
            if i > 0:
                logging.warning(f"succeeded after {i} retries")
            return res
        except Exception as err:
            msg = str(err)
        time.sleep(interval)
    raise ValueError(f"{msg}\n(After {retry} retries)")


async def download_raw_with_retry(
    session: "ClientSession",
    url: str,
    *,
    retry: int = 3,
    interval: int = 1,
    **kw: Any,
) -> bytes:
    return await retry_with(download_raw, session, url, retry, interval, **kw)


async def download_image_with_retry(
    session: "ClientSession",
    url: str,
    *,
    retry: int = 3,
    interval: int = 1,
    **kw: Any,
) -> "Image.Image":
    return await retry_with(download_image, session, url, retry, interval, **kw)
