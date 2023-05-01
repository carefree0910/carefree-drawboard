from io import BytesIO
from abc import abstractmethod
from abc import ABCMeta
from PIL import Image
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from cfdraw import constants
from cfdraw.utils import server
from cfdraw.utils.misc import deprecated
from cfdraw.utils.misc import offload_run
from cfdraw.schema.plugins import *
from cfdraw.plugins.middlewares import *
from cfdraw.parsers.noli import SingleNodeType
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.parsers.chakra import IChakra


class ISocketPlugin(IPlugin, metaclass=ABCMeta):
    @abstractmethod
    async def process(self, data: ISocketRequest) -> Any:
        pass

    # internal APIs

    @property
    def middlewares(self) -> List[IMiddleWare]:
        common_middlewares: List[IMiddleWare] = [
            TextAreaMiddleWare(self),
            FieldsMiddleWare(self),
            TimerMiddleWare(self),
        ]
        send_message_middleware = SendSocketMessageMiddleWare(self)
        return common_middlewares + [send_message_middleware]

    async def __call__(self, data: ISocketRequest) -> ISocketMessage:
        middlewares = self.middlewares
        for middleware in middlewares:
            await middleware.before(data)
        response = await self.process(data)
        for middleware in middlewares:
            response = await middleware(response)
        return response

    def hash_identifier(self, identifier: str) -> str:
        return f"{identifier}.{self.hash}"

    def to_plugin_settings(self) -> Dict[str, Any]:
        d = self.settings.dict(exclude={"pluginInfo"})
        pI = self.settings.pluginInfo
        kw = dict(exclude={"plugins"}) if isinstance(pI, IPluginGroupInfo) else {}
        plugin_info = self.settings.pluginInfo.dict(**kw)
        plugin_info["identifier"] = self.hash_identifier(self.identifier)
        if isinstance(pI, IPluginGroupInfo):
            plugins: List[Dict[str, Any]] = []
            for identifier, p_base in pI.plugins.items():
                p_base.hash = self.hash
                p = p_base()
                p.identifier = identifier
                plugins.append(p.to_plugin_settings())
            plugin_info["plugins"] = plugins
        node_constraint = d.pop("nodeConstraint")
        chakra_props = {}
        for field in IChakra.__fields__:
            # `w` and `h` are special fields, should not be included in `chakra_props`
            if field in ["w", "h"]:
                continue
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
        return dict(type=self.type, props=props)

    # helper methods

    def filter(self, nodes: List[INodeData], target: SingleNodeType) -> List[INodeData]:
        return list(filter(lambda node: node.type == target, nodes))

    async def load_image(self, src: str) -> Image.Image:
        # check whether the incoming url refers to a local image
        # if so, load it from the local file system directly
        if src.startswith("http://") and constants.UPLOAD_IMAGE_FOLDER_NAME in src:
            file = src.split(constants.UPLOAD_IMAGE_FOLDER_NAME)[1][1:]  # remove '/'
            return server.get_image(file)
        async with self.http_session.get(src) as res:
            return Image.open(BytesIO(await res.read()))

    def send_progress(
        self,
        progress: float,
        intermediate: Optional[ISocketIntermediate] = None,
    ) -> bool:
        message = ISocketMessage.make_progress(self.task_hash, progress, intermediate)
        return offload_run(self.send_message(message))


class IInternalSocketPlugin(ISocketPlugin, metaclass=ABCMeta):
    @property
    def type(self) -> PluginType:
        return PluginType._INTERNAL

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(w=1, h=1, nodeConstraint=NodeConstraints.NONE)


# bindings


class ITextAreaPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.TEXT_AREA


class IQAPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.QA


class IFieldsPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.FIELDS


class IPluginGroup(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.PLUGIN_GROUP

    def process(self, data: ISocketRequest) -> Any:
        return


## deprecated


@deprecated("please use `ISocketPlugin` instead")
class IHttpPlugin(ISocketPlugin, metaclass=ABCMeta):
    pass


@deprecated("please use `ITextAreaPlugin` instead")
class IHttpTextAreaPlugin(ITextAreaPlugin):
    pass


@deprecated("please use `IQAPlugin` instead")
class IHttpQAPlugin(IQAPlugin):
    pass


@deprecated("please use `IFieldsPlugin` instead")
class IHttpFieldsPlugin(IFieldsPlugin):
    pass


__all__ = [
    "ISocketPlugin",
    "IInternalSocketPlugin",
    "ITextAreaPlugin",
    "IQAPlugin",
    "IFieldsPlugin",
    "IPluginGroup",
    # deprecated
    "IHttpPlugin",
    "IHttpTextAreaPlugin",
    "IHttpQAPlugin",
    "IHttpFieldsPlugin",
]
