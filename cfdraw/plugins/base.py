from abc import abstractmethod
from abc import ABCMeta
from typing import List
from typing import Generic
from typing import TypeVar

from cfdraw.schema.plugins import *
from cfdraw.plugins.middlewares import *


THttpResponse = TypeVar("THttpResponse", bound="IHttpResponse", covariant=True)
TSocketResponse = TypeVar("TSocketResponse", bound="ISocketResponse", covariant=True)


class IHttpPlugin(Generic[THttpResponse], IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def process(self, data: IHttpPluginRequest) -> THttpResponse:
        pass

    def __call__(self, data: IRawHttpPluginRequest) -> THttpResponse:
        response = self.process(data.parse())
        for middleware in self.middlewares:
            response = middleware(self, response)
        return response


class ISocketPlugin(Generic[TSocketResponse], IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def __call__(self, data: ISocketPluginMessage) -> TSocketResponse:
        pass


__all__ = [
    "IHttpPlugin",
    "ISocketPlugin",
]
