from typing import Dict
from aiohttp import ClientSession
from fastapi import FastAPI

from cfdraw.config import Config
from cfdraw.schema.plugins import IPlugin


class IApp:
    api: FastAPI
    config: Config
    http_session: ClientSession

    @property
    def plugins(self) -> Dict[str, IPlugin]:
        pass

    @property
    def internal_plugins(self) -> Dict[str, IPlugin]:
        pass
