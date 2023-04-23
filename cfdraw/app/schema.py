from abc import abstractmethod
from abc import ABC
from typing import Any
from typing import Callable
from typing import Optional
from typing import Coroutine
from aiohttp import ClientSession
from asyncio import Event
from fastapi import FastAPI
from dataclasses import dataclass

from cfdraw.config import Config
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.plugins.factory import Plugins


@dataclass
class IRequestQueueData:
    request: ISocketRequest
    plugin: IPlugin
    event: Event

    def __str__(self) -> str:
        return self.request.identifier.split(".")[0]

    __repr__ = __str__


ISend = Callable[[ISocketMessage], Coroutine[Any, Any, None]]


class IRequestQueue(ABC):
    @abstractmethod
    def push(self, data: IRequestQueueData, send_text: ISend) -> str:
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
