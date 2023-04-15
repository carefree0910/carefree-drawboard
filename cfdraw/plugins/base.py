from abc import abstractmethod
from abc import ABCMeta
from typing import Any
from typing import List

from cfdraw.schema.plugins import *
from cfdraw.plugins.middlewares import *


class IBasePlugin(IPlugin, metaclass=ABCMeta):
    @abstractmethod
    async def process(self, data: IPluginRequest) -> Any:
        pass

    @property
    def middlewares(self) -> List[IMiddleWare]:
        return []

    async def __call__(self, data: IPluginRequest) -> IPluginResponse:
        middlewares = self.middlewares
        for middleware in middlewares:
            await middleware.before(data)
        response = await self.process(data)
        for middleware in middlewares:
            response = await middleware(self, response)
        return response


class IHttpPlugin(IBasePlugin, metaclass=ABCMeta):
    @property
    def middlewares(self) -> List[IMiddleWare]:
        return [TextAreaMiddleWare(), FieldsMiddleWare(), TimerMiddleWare()]


class ISocketPlugin(IBasePlugin, metaclass=ABCMeta):
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
