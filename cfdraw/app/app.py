from typing import Dict
from aiohttp import ClientSession
from fastapi import FastAPI
from cftool.misc import print_info
from cftool.misc import random_hash
from fastapi.middleware import cors

from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.app.schema import IApp
from cfdraw.app.endpoints import *
from cfdraw.schema.plugins import IPlugin
from cfdraw.plugins.factory import PluginFactory


async def ping() -> str:
    return "pong"


class App(IApp):
    def __init__(self):
        # config
        self.config = get_config()

        # clients
        self.http_session = ClientSession()

        # fastapi
        self.api = FastAPI()
        self.add_cors()
        self.add_default_endpoints()
        self.add_events()
        add_plugins(self)
        add_websocket(self)
        add_upload_image(self)
        add_project_managements(self)
        self.hash = random_hash()

    def __str__(self) -> str:
        return "<App />"

    __repr__ = __str__

    @property
    def plugins(self) -> Dict[str, IPlugin]:
        return PluginFactory.plugins

    @property
    def internal_plugins(self) -> Dict[str, IPlugin]:
        return PluginFactory.internal_plugins

    def add_cors(self) -> None:
        self.api.add_middleware(
            cors.CORSMiddleware,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            allow_origins=["*"],
        )

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

    def add_default_endpoints(self) -> None:
        self.api.get(str(constants.Endpoint.PING))(ping)


__all__ = [
    "App",
]
