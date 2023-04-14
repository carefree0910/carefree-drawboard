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
        return [TextAreaMiddleWare(), FieldsMiddleWare(), TimerMiddleWare()]

    def __call__(self, data: IHttpPluginRequest) -> IHttpPluginResponse:
        middlewares = self.middlewares
        for middleware in middlewares:
            middleware.before(data)
        response = self.process(data)
        for middleware in middlewares:
            response = middleware(self, response)
        return response


class ISocketPlugin(Generic[TSocketResponse], IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def __call__(self, data: ISocketPluginMessage) -> TSocketResponse:
        pass


# bindings


class IHttpTextAreaPlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_TEXT_AREA


class IHttpQAPlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_QA


class IHttpFieldsPlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_FIELDS


__all__ = [
    "IHttpPlugin",
    "ISocketPlugin",
    "IHttpTextAreaPlugin",
    "IHttpQAPlugin",
    "IHttpFieldsPlugin",
]
