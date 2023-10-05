import random

import numpy as np

from io import BytesIO
from PIL import Image
from typing import Any
from typing import Dict
from typing import Union
from fastapi import Response
from PIL.PngImagePlugin import PngInfo
from cftool.cv import to_rgb
from cftool.cv import np_to_bytes
from cftool.web import raise_err
from cftool.misc import random_hash

from cfdraw.config import get_config


def save_svg(svg: str, base_url: str) -> Dict[str, Any]:
    config = get_config()
    state = random.getstate()
    random.seed()
    path = config.upload_image_folder / f"{random_hash()}.svg"
    random.setstate(state)
    with path.open("w") as f:
        f.write(svg)
    base_url = base_url.rstrip("/")
    url = f"{base_url}/{path.relative_to(config.upload_root_path).as_posix()}"
    return dict(w=0, h=0, url=url)


def save_image(image: Image.Image, meta: PngInfo, base_url: str) -> Dict[str, Any]:
    w, h = image.size
    config = get_config()
    state = random.getstate()
    random.seed()
    path = config.upload_image_folder / f"{random_hash()}.png"
    random.setstate(state)
    image.save(path, pnginfo=meta)
    base_url = base_url.rstrip("/")
    url = f"{base_url}/{path.relative_to(config.upload_root_path).as_posix()}"
    return dict(w=w, h=h, url=url)


def get_svg_response(file: str) -> Response:
    config = get_config()
    try:
        svg_path = config.upload_image_folder / file
        with svg_path.open("r") as f:
            content = f.read()
        return Response(content=content, media_type="image/svg+xml")
    except Exception as err:
        raise_err(err)


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


def get_image_response(  # type: ignore
    file: str,
    jpeg: bool = False,
    return_image: bool = False,
) -> Union[Response, Image.Image]:
    config = get_config()
    try:
        image = Image.open(config.upload_image_folder / file)
        if not jpeg:
            if return_image:
                return image
            content = np_to_bytes(np.array(image))
        else:
            with BytesIO() as f:
                to_rgb(image).save(f, format="JPEG", quality=95)
                f.seek(0)
                if return_image:
                    return Image.open(f)
                content = f.read()
        return Response(content=content, media_type="image/png")
    except Exception as err:
        raise_err(err)
