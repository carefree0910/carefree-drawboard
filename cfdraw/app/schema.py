from abc import abstractmethod
from abc import ABC
from aiohttp import ClientSession
from asyncio import Event
from fastapi import FastAPI

from cfdraw.config import Config
from cfdraw.schema.plugins import ISend
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.plugins.factory import Plugins


class IRequestQueueData:
    def __init__(self, request: ISocketRequest, plugin: IPlugin):
        self.request = request
        self.plugin = plugin
        self.event = Event()

    def __str__(self) -> str:
        return self.request.identifier.split(".")[0]

    __repr__ = __str__


class IRequestQueue(ABC):
    @abstractmethod
    def push(self, data: IRequestQueueData, send_message: ISend) -> str:
        pass

    @abstractmethod
    async def run(self) -> None:
        pass

    @abstractmethod
    async def wait(self, user_id: str, uid: str) -> None:
        pass


class IApp(ABC):
    api: FastAPI
    config: Config
    http_session: ClientSession
    request_queue: IRequestQueue

    @property
    @abstractmethod
    def plugins(self) -> Plugins:
        pass

    @property
    @abstractmethod
    def internal_plugins(self) -> Plugins:
        pass
