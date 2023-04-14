import json

import numpy as np

from io import BytesIO
from PIL import Image
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from fastapi import FastAPI
from fastapi import File
from fastapi import Response
from fastapi import WebSocket
from fastapi import UploadFile
from pydantic import BaseModel
from cftool.cv import to_rgb
from cftool.cv import np_to_bytes
from cftool.misc import print_info
from cftool.misc import random_hash
from fastapi.middleware import cors

from cfdraw import constants
from cfdraw.utils import server
from cfdraw.config import get_config
from cfdraw.parsers import noli
from cfdraw.compilers import plugin
from cfdraw.compilers import settings
from cfdraw.utils.server import raise_err
from cfdraw.utils.server import get_err_msg
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
        self.add_project_managements()
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

        @self.api.get(
            f"/{constants.UPLOAD_IMAGE_FOLDER_NAME}/{{file}}/",
            **get_image_response_kwargs(),
        )
        async def fetch_image(file: str, jpeg: bool = False) -> Response:
            try:
                image = Image.open(self.config.upload_image_folder / file)
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

    def add_project_managements(self) -> None:
        class ProjectItem(BaseModel):
            uid: str
            name: str

        class ProjectModel(ProjectItem):
            uid: str
            name: str
            createTime: float
            updateTime: float
            graphInfo: List[Any]
            globalTransform: noli.Matrix2D

        class SaveProjectResponse(BaseModel):
            success: bool
            message: str

        @self.api.post("/save_project", responses=get_responses(SaveProjectResponse))
        def save_project(data: ProjectModel) -> SaveProjectResponse:
            try:
                file = f"{data.uid}.cfdraw"
                with open(self.config.upload_project_folder / file, "w") as f:
                    json.dump(data.dict(), f)
            except Exception as err:
                err_msg = get_err_msg(err)
                return SaveProjectResponse(success=False, message=err_msg)
            return SaveProjectResponse(success=True, message="")

        @self.api.get(
            f"/get_project/{{uid:path}}",
            responses=get_responses(ProjectModel),
        )
        async def fetch_project(uid: str) -> ProjectModel:
            try:
                file = f"{uid}.cfdraw"
                with open(self.config.upload_project_folder / file, "r") as f:
                    d = json.load(f)
                # replace url if needed
                graph = noli.parse_graph(d["graphInfo"])
                for node in graph.all_single_nodes:
                    if node.type == noli.SingleNodeType.IMAGE:
                        src = node.renderParams.src
                        if (
                            src
                            and isinstance(src, str)
                            and src.startswith(self.config.api_host)
                        ):
                            pivot = constants.UPLOAD_IMAGE_FOLDER_NAME
                            _, path = src.split(pivot)
                            api_url = self.config.api_url
                            node.renderParams.src = api_url + "/" + pivot + path
                d["graphInfo"] = graph.dict()["root_nodes"]
                return ProjectModel(**d)
            except Exception as err:
                raise_err(err)

        @self.api.get(f"/all_projects")
        async def fetch_all_projects() -> List[ProjectItem]:
            if not self.config.upload_project_folder.exists():
                return []
            try:
                results: List[ProjectItem] = []
                for file in self.config.upload_project_folder.iterdir():
                    if file.suffix != ".cfdraw":
                        continue
                    path = self.config.upload_project_folder / file
                    with open(path, "r") as f:
                        d = json.load(f)
                    results.append(ProjectItem(uid=d["uid"], name=d["name"]))
                return results
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
                    useStrictMode=self.config.use_react_strict_mode,
                )
            )
            upload_root_path = self.config.upload_root_path
            print_info(f"🔔 Your files will be saved to '{upload_root_path}'")
            print_info("🎉 Server is Ready!")
