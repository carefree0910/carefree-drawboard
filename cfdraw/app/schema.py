from abc import abstractmethod
from abc import ABC
from typing import Dict
from aiohttp import ClientSession
from fastapi import FastAPI

from cfdraw.config import Config
from cfdraw.schema.plugins import IPlugin


class IApp(ABC):
    api: FastAPI
    config: Config
    http_session: ClientSession

    @property
    @abstractmethod
    def plugins(self) -> Dict[str, IPlugin]:
        pass

    @property
    @abstractmethod
    def internal_plugins(self) -> Dict[str, IPlugin]:
        pass
