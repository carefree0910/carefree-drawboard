import numpy as np

from io import BytesIO
from PIL import Image
from typing import Any
from typing import Dict
from typing import Optional
from fastapi import FastAPI
from fastapi import File
from fastapi import Response
from fastapi import WebSocket
from fastapi import UploadFile
from pydantic import BaseModel
from cftool.cv import np_to_bytes
from cftool.misc import print_info
from cftool.misc import random_hash
from fastapi.middleware import cors

from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.compilers import plugin
from cfdraw.compilers import settings
from cfdraw.utils.server import raise_err
from cfdraw.utils.server import get_err_msg
from cfdraw.utils.server import upload_image
from cfdraw.utils.server import get_responses
from cfdraw.utils.server import get_image_response_kwargs
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import IHttpPluginResponse
from cfdraw.schema.plugins import IRawHttpPluginRequest
from cfdraw.plugins.base import IHttpPlugin
from cfdraw.plugins.base import ISocketPlugin
from cfdraw.plugins.factory import PluginFactory


async def ping() -> str:
    return "pong"


class App:
    def __init__(self):
        # config
        self.config = get_config()

        # fastapi
        self.api = FastAPI()
        self.add_cors()
        self.add_default_endpoints()
        self.add_websocket()
        self.add_upload_image()
        self.add_plugins()
        self.add_on_startup()
        self.hash = random_hash()

    def __str__(self) -> str:
        return "<App />"

    __repr__ = __str__

    # plugins

    @property
    def plugins(self) -> Dict[str, IPlugin]:
        return PluginFactory.plugins

    def hash_identifier(self, identifier: str) -> str:
        return f"{identifier}.{self.hash}"

    # fastapi

    def add_cors(self) -> None:
        self.api.add_middleware(
            cors.CORSMiddleware,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            allow_origins=["*"],
        )

    def add_default_endpoints(self) -> None:
        self.api.get(str(constants.Endpoint.PING))(ping)

    def add_websocket(self) -> None:
        @self.api.websocket(str(constants.Endpoint.WEBSOCKET))
        async def websocket(websocket: WebSocket) -> None:
            await websocket.accept()
            while True:
                data = await websocket.receive_text()
                await websocket.send_text(f"Message text was: {data}")

    def add_upload_image(self) -> None:
        class ImageDataModel(BaseModel):
            w: int
            h: int
            url: str

        class UploadImageResponse(BaseModel):
            success: bool
            message: str
            data: Optional[ImageDataModel]

        @self.api.post("/upload_image", responses=get_responses(UploadImageResponse))
        def upload(image: UploadFile = File(...)) -> UploadImageResponse:
            try:
                contents = image.file.read()
                loaded_image = Image.open(BytesIO(contents))
                res = upload_image(loaded_image)
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

        @self.api.get(
            f"/{constants.UPLOAD_IMAGE_FOLDER_NAME}/{{file:path}}",
            **get_image_response_kwargs(),
        )
        async def fetch_image(file: str) -> Response:
            try:
                image = Image.open(constants.UPLOAD_IMAGE_FOLDER / file)
                content = np_to_bytes(np.array(image))
                return Response(content=content, media_type="image/png")
            except Exception as err:
                raise_err(err)

    def add_plugins(self) -> None:
        for identifier, plugin in self.plugins.items():
            # TODO : handle socket plugins
            if isinstance(plugin, ISocketPlugin):
                continue
            endpoint = f"/{identifier}"
            print_info(f"registering endpoint '{endpoint}'")

            def _register(_id: str, _p: IHttpPlugin) -> None:
                @self.api.post(
                    endpoint,
                    name=endpoint[1:].replace("/", "_"),
                    responses=get_responses(IHttpPluginResponse),
                )
                def fn(data: IRawHttpPluginRequest) -> Any:
                    if self.hash_identifier(_id) != data.identifier:
                        return IHttpPluginResponse(
                            success=False,
                            message=(
                                f"internal error occurred: identifier mismatch, "
                                f"current hash is {self.hash_identifier(_id)} "
                                f"but incoming identifier is {data.identifier}"
                            ),
                            data=BaseModel(),
                        )
                    return _p(data)

            _register(identifier, plugin)

    def add_on_startup(self) -> None:
        @self.api.on_event("startup")
        def startup() -> None:
            self.hash = random_hash()
            print_info(f"🚀 Starting Server at {self.config.api_url} ...")
            print_info("🔨 Compiling Plugins...")
            plugin.set_plugin_settings(
                {
                    self.hash_identifier(identifier): plugin
                    for identifier, plugin in self.plugins.items()
                }
            )
            settings.set_constants(
                dict(
                    backendPort=int(self.config.backend_port),
                )
            )
            print_info("🎉 Server is Ready!")
