from io import BytesIO
from abc import abstractmethod
from abc import ABCMeta
from PIL import Image
from typing import Any
from typing import Dict
from typing import List
from typing import Callable
from typing import Coroutine

from cfdraw import constants
from cfdraw.utils import server
from cfdraw.schema.plugins import *
from cfdraw.plugins.middlewares import *
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.parsers.chakra import IChakra


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

    def hash_identifier(self, identifier: str) -> str:
        return f"{identifier}.{self.hash}"

    def to_plugin_settings(self) -> Dict[str, Any]:
        d = self.settings.dict()
        plugin_info = d.pop("pluginInfo")
        # `identifier` has hashed into `{identifier}.{hash}`
        plugin_info["endpoint"] = f"/{self.identifier}"
        plugin_info["identifier"] = self.hash_identifier(self.identifier)
        plugin_type = f"_python.{self.type}"
        offset_x = d.pop("offsetX")
        offset_y = d.pop("offsetY")
        node_constraint = d.pop("nodeConstraint")
        chakra_props = {}
        for field in IChakra.__fields__:
            chakra_value = d.pop(field)
            if chakra_value is not None:
                chakra_props[field] = chakra_value
        for k, v in list(d.items()):
            if v is None:
                d.pop(k)
        props = dict(
            nodeConstraint=node_constraint,
            pluginInfo=plugin_info,
            renderInfo=d,
            **chakra_props,
        )
        if offset_x is not None:
            props["offsetX"] = offset_x
        if offset_y is not None:
            props["offsetY"] = offset_y
        return dict(type=plugin_type, props=props)

    async def load_image(self, src: str) -> Image.Image:
        # check whether the incoming url refers to a local image
        # if so, load it from the local file system directly
        if src.startswith("http://") and constants.UPLOAD_IMAGE_FOLDER_NAME in src:
            file = src.split(constants.UPLOAD_IMAGE_FOLDER_NAME)[1][1:]  # remove '/'
            return server.get_image(file)
        async with self.http_session.get(src) as res:
            return Image.open(BytesIO(await res.read()))


class IHttpPlugin(IBasePlugin, metaclass=ABCMeta):
    @property
    def middlewares(self) -> List[IMiddleWare]:
        return [TextAreaMiddleWare(), FieldsMiddleWare(), TimerMiddleWare()]


class ISocketPlugin(IBasePlugin, metaclass=ABCMeta):
    send_text: Callable[[ISocketMessage], Coroutine[Any, Any, None]]

    @abstractmethod
    async def process(self, data: IPluginRequest) -> ISocketMessage:
        pass


class IInternalSocketPlugin(ISocketPlugin, metaclass=ABCMeta):
    @property
    def type(self) -> PluginType:
        PluginType._INTERNAL

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(w=1, h=1, nodeConstraint=NodeConstraints.NONE)


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
    "IInternalSocketPlugin",
    "IHttpTextAreaPlugin",
    "IHttpQAPlugin",
    "IHttpFieldsPlugin",
]
