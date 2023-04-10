from abc import abstractmethod
from abc import ABCMeta
from typing import List
from typing import Generic
from typing import TypeVar

from cfdraw.schema.plugins import *
from cfdraw.plugins.middlewares import *


TSocketResponse = TypeVar("TSocketResponse", bound="ISocketResponse", covariant=True)


class IHttpPlugin(IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def process(self, data: IHttpPluginRequest) -> IHttpPluginResponse:
        pass

    @property
    def middlewares(self) -> List[IMiddleWare]:
        return [TextAreaMiddleWare()]

    def __call__(self, data: IRawHttpPluginRequest) -> IHttpPluginResponse:
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
