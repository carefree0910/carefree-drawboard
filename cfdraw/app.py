import json
import logging

from io import BytesIO
from PIL import Image
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from aiohttp import ClientSession
from fastapi import FastAPI
from fastapi import File
from fastapi import Response
from fastapi import WebSocket
from fastapi import UploadFile
from fastapi import WebSocketDisconnect
from pydantic import BaseModel
from cftool.misc import print_info
from cftool.misc import random_hash
from fastapi.middleware import cors

from cfdraw import constants
from cfdraw.utils import server
from cfdraw.config import get_config
from cfdraw.parsers import noli
from cfdraw.utils.server import raise_err
from cfdraw.utils.server import get_err_msg
from cfdraw.utils.server import get_responses
from cfdraw.utils.server import get_image_response_kwargs
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import IPluginRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.plugins.base import IHttpPlugin
from cfdraw.plugins.base import ISocketPlugin
from cfdraw.plugins.factory import PluginFactory


async def ping() -> str:
    return "pong"


class App:
    def __init__(self):
        # config
        self.config = get_config()

        # clients
        self.http_session = ClientSession()

        # fastapi
        self.api = FastAPI()
        self.add_cors()
        self.add_default_endpoints()
        self.add_websocket()
        self.add_upload_image()
        self.add_project_managements()
        self.add_plugins()
        self.add_events()
        self.hash = random_hash()

    def __str__(self) -> str:
        return "<App />"

    __repr__ = __str__

    # plugins

    @property
    def plugins(self) -> Dict[str, IPlugin]:
        return PluginFactory.plugins

    @property
    def internal_plugins(self) -> Dict[str, IPlugin]:
        return PluginFactory.internal_plugins

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
            async def on_failed(e: Exception) -> None:
                logging.exception(e)
                response = IPluginResponse(
                    success=False,
                    message=f"Invalid data: {get_err_msg(e)}",
                    data={},
                )
                await websocket.send_text(json.dumps(response.dict()))

            async def sent_text(data: ISocketMessage) -> None:
                await websocket.send_text(json.dumps(data.dict()))

            await websocket.accept()
            while True:
                try:
                    raw_data = await websocket.receive_text()
                    data = IPluginRequest(**json.loads(raw_data))
                    if data.isInternal:
                        identifier = data.identifier
                        target_plugin = self.internal_plugins.get(identifier)
                    else:
                        identifier = data.identifier.split(".", 1)[-1]  # remove hash
                        target_plugin = self.plugins.get(identifier)
                    if target_plugin is None:
                        plugin_str = "internal plugin" if data.isInternal else "plugin"
                        response = IPluginResponse(
                            success=False,
                            message=(
                                f"incoming message subscribed {plugin_str} '{identifier}', "
                                "but it is not found"
                            ),
                            data={},
                        )
                    elif not isinstance(target_plugin, ISocketPlugin):
                        response = IPluginResponse(
                            success=False,
                            message=(
                                f"incoming message subscribed plugin '{identifier}', "
                                "but it is not a socket plugin"
                            ),
                            data={},
                        )
                    else:
                        target_plugin.send_text = sent_text
                        response = await target_plugin(data)
                    await sent_text(response)
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    await on_failed(e)

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
            return server.get_image_response(file, jpeg)

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
            if isinstance(plugin, ISocketPlugin):
                continue
            endpoint = f"/{identifier}"
            print_info(f"registering endpoint '{endpoint}'")

            def _register(_id: str, _p: IHttpPlugin) -> None:
                @self.api.post(
                    endpoint,
                    name=endpoint[1:].replace("/", "_"),
                    responses=get_responses(IPluginResponse),
                )
                async def fn(data: IPluginRequest) -> IPluginResponse:
                    if _p.hash_identifier(_id) != data.identifier:
                        return IPluginResponse(
                            success=False,
                            message=(
                                f"internal error occurred: identifier mismatch, "
                                f"current hash is {_p.hash_identifier(_id)} "
                                f"but incoming identifier is {data.identifier}"
                            ),
                            data={},
                        )
                    return await _p(data)

            _register(identifier, plugin)

    def add_events(self) -> None:
        @self.api.on_event("startup")
        async def startup() -> None:
            self.hash = random_hash()
            print_info(f"🚀 Starting Server at {self.config.api_url} ...")
            print_info("🔨 Compiling Plugins...")
            for plugin in self.plugins.values():
                plugin.hash = self.hash
                plugin.http_session = self.http_session
            upload_root_path = self.config.upload_root_path
            print_info(f"🔔 Your files will be saved to '{upload_root_path}'")
            print_info("🎉 Server is Ready!")

        @self.api.on_event("shutdown")
        async def shutdown() -> None:
            await self.http_session.close()
            for plugin in self.plugins.values():
                plugin.http_session = None
            self.http_session = None
