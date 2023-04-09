import numpy as np

from io import BytesIO
from PIL import Image
from typing import Any
from typing import Dict
from typing import Type
from typing import Callable
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
from cfdraw.utils.server import get_responses
from cfdraw.utils.server import get_image_response_kwargs
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import ISocketPlugin
from cfdraw.schema.plugins import IHttpResponse
from cfdraw.schema.plugins import IHttpPluginRequest


TPlugin = Type[IPlugin]


async def ping() -> str:
    return "pong"


class App:
    plugins: Dict[str, IPlugin] = {}

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

    @classmethod
    def register_plugin(cls, identifier: str) -> Callable[[TPlugin], TPlugin]:
        if identifier in cls.plugins:
            raise ValueError(f"plugin {identifier} already exists")

        def _register(plugin: TPlugin) -> TPlugin:
            plugin.identifier = identifier
            cls.plugins[identifier] = plugin()
            return plugin

        return _register

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
            url: str
            w: int
            h: int

        class UploadImageModel(BaseModel):
            success: bool
            message: str
            data: Optional[ImageDataModel]

        @self.api.post("/upload_image", responses=get_responses(UploadImageModel))
        def upload(image: UploadFile = File(...)) -> UploadImageModel:
            try:
                contents = image.file.read()
                loaded_image = Image.open(BytesIO(contents))
                w, h = loaded_image.size
                path = constants.UPLOAD_FOLDER / f"{random_hash()}.png"
                loaded_image.save(path)
            except Exception as err:
                err_msg = get_err_msg(err)
                return UploadImageModel(success=False, message=err_msg, data=None)
            finally:
                image.file.close()
            url_path = path.relative_to(constants.PARENT).as_posix()
            return UploadImageModel(
                success=True,
                message="",
                data=ImageDataModel(url=f"{self.config.api_url}/{url_path}", w=w, h=h),
            )

        @self.api.get(
            f"/{constants.UPLOAD_FOLDER_NAME}/{{file:path}}",
            **get_image_response_kwargs(),
        )
        async def fetch_image(file: str) -> Response:
            try:
                image = Image.open(constants.UPLOAD_FOLDER / file)
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

            @self.api.post(
                endpoint,
                name=endpoint[1:].replace("/", "_"),
                responses=get_responses(IHttpResponse),
            )
            def fn(data: IHttpPluginRequest) -> Any:
                if self.hash_identifier(identifier) != data.identifier:
                    return IHttpResponse(
                        success=False,
                        message="internal error occurred: identifier mismatch",
                        data=BaseModel(),
                    )
                return plugin(data)

    def add_on_startup(self) -> None:
        @self.api.on_event("startup")
        def startup() -> None:
            self.hash = random_hash()
            print_info(f"🚀 Starting Server at {self.config.api_url} ...")
            print_info("🔨 Compiling Plugins...")
            plugin.set_plugin_settings(
                {
                    self.hash_identifier(identifier): plugin.settings
                    for identifier, plugin in self.plugins.items()
                }
            )
            settings.set_constants(
                dict(
                    backendPort=int(self.config.backend_port),
                )
            )
            print_info("🎉 Server is Ready!")
