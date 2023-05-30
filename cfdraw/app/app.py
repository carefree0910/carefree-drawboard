from typing import List
from typing import Type
from typing import Optional
from typing import AsyncGenerator
from aiohttp import ClientSession
from fastapi import FastAPI
from contextlib import asynccontextmanager
from cftool.misc import print_info
from cftool.misc import random_hash
from fastapi.middleware import cors

from cfdraw import constants
from cfdraw.utils import console
from cfdraw.config import get_config
from cfdraw.app.schema import IApp
from cfdraw.app.endpoints import *
from cfdraw.schema.plugins import IPlugin
from cfdraw.plugins.factory import Plugins
from cfdraw.plugins.factory import PluginFactory


async def ping() -> str:
    return "pong"


class App(IApp):
    def __init__(self, notification: Optional[str] = None) -> None:
        # FastAPI lifspan

        @asynccontextmanager
        async def lifespan(api: FastAPI) -> AsyncGenerator:
            # startup

            def info(msg: str) -> None:
                print_info(msg)

            info(f"🚀 Starting Backend Server at {self.config.api_url} ...")
            info("🔨 Compiling Plugins & Endpoints...")
            tplugin_with_notification: List[Type[IPlugin]] = []
            for tplugin in self.plugins.values():
                tplugin.hash = self.hash
                tplugin.http_session = self.http_session
                if tplugin.notification is not None:
                    tplugin_with_notification.append(tplugin)
            if tplugin_with_notification or notification is not None:
                console.rule("")
                info(f"📣 Notifications:")
                if notification is not None:
                    console.rule(f"[bold green][ GLOBAL ]")
                    console.print(notification)
                if tplugin_with_notification:
                    for tplugin in tplugin_with_notification:
                        console.rule(f"[bold green][ {tplugin.identifier} ]")
                        console.print(tplugin.notification)  # type: ignore
                console.rule("")
            for endpoint in self.endpoints:
                await endpoint.on_startup()
            upload_root_path = self.config.upload_root_path
            info(f"🔔 Your files will be saved to '{upload_root_path}'")
            info("🎉 Backend Server is Ready!")

            yield

            # shutdown

            await self.http_session.close()
            for tplugin in self.plugins.values():
                tplugin.http_session = None
            for endpoint in self.endpoints:
                await endpoint.on_shutdown()
            self.http_session = None

        # config
        self.config = get_config()
        # clients
        self.http_session = ClientSession()
        # queue
        self.request_queue = RequestQueue()
        # fastapi
        self.api = FastAPI(lifespan=lifespan)
        self.add_cors()
        self.add_default_endpoints()
        self.endpoints: List[IEndpoint] = [
            UploadEndpoint(self),
            ProjectEndpoint(self),
            WebsocketEndpoint(self),
        ]
        if self.config.use_unified:
            self.endpoints.append(AssetsEndpoint(self))
        for endpoint in self.endpoints:
            endpoint.register()
        self.hash = random_hash()

    def __str__(self) -> str:
        return "<App />"

    __repr__ = __str__

    @property
    def plugins(self) -> Plugins:
        return PluginFactory.plugins

    @property
    def internal_plugins(self) -> Plugins:
        return PluginFactory.internal_plugins

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


__all__ = [
    "App",
]
