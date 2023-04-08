from typing import Dict
from typing import List
from typing import Type
from typing import Callable
from fastapi import FastAPI
from fastapi import WebSocket
from pydantic import BaseModel
from cftool.misc import print_info
from cftool.misc import random_hash
from fastapi.middleware import cors

from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.schema import IPlugin
from cfdraw.schema import IResponse
from cfdraw.schema import IPluginRequest
from cfdraw.compilers import plugin
from cfdraw.utils.server import get_responses


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

    def add_plugins(self) -> None:
        endpoint_to_plugins: Dict[str, List[IPlugin]] = {}
        for plugin in self.plugins.values():
            endpoint = plugin.settings.endpoint
            if endpoint != str(constants.Endpoint.WEBSOCKET):
                endpoint_to_plugins.setdefault(endpoint, []).append(plugin)
        for endpoint, plugins in endpoint_to_plugins.items():
            print_info(
                f"registering endpoint '{endpoint}' with plugins: "
                f"{', '.join(plugin.identifier for plugin in plugins)}"
            )

            @self.api.post(
                endpoint,
                name=endpoint[1:].replace("/", "_"),
                responses=get_responses(IResponse),
            )
            def fn(data: IPluginRequest) -> IResponse:
                for plugin in plugins:
                    if self.hash_identifier(plugin.identifier) == data.identifier:
                        return plugin(data)
                return IResponse(
                    success=False,
                    message=f"cannot find plugin with identifier '{data.identifier}'",
                    data=BaseModel(),
                )

    def add_on_startup(self) -> None:
        @self.api.on_event("startup")
        def startup() -> None:
            self.hash = random_hash()
            print_info("🚀 Starting Server...")
            print_info("🔨 Compiling Plugins...")
            plugin.set_plugin_settings(
                {
                    self.hash_identifier(identifier): plugin.settings
                    for identifier, plugin in self.plugins.items()
                }
            )
            print_info("🎉 Server is Ready!")
