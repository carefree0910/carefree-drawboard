from abc import abstractmethod
from abc import ABC
from typing import Dict
from typing import Optional
from aiohttp import ClientSession
from asyncio import Event
from fastapi import FastAPI
from dataclasses import dataclass

from cfdraw.config import Config
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import IPluginRequest
from cfdraw.schema.plugins import IPluginResponse


@dataclass
class IRequestQueueData:
    request: IPluginRequest
    plugin: IPlugin
    event: Event


class IRequestQueue(ABC):
    @abstractmethod
    def push(self, data: IRequestQueueData) -> str:
        pass

    @abstractmethod
    def pop_response(self, uid: str) -> Optional[IPluginResponse]:
        pass

    @abstractmethod
    async def run(self) -> None:
        pass

    @abstractmethod
    async def wait(self, uid: str) -> None:
        pass


class IApp(ABC):
    api: FastAPI
    config: Config
    http_session: ClientSession
    request_queue: IRequestQueue

    @property
    @abstractmethod
    def plugins(self) -> Dict[str, IPlugin]:
        pass

    @property
    @abstractmethod
    def internal_plugins(self) -> Dict[str, IPlugin]:
        pass
