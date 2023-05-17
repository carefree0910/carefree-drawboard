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
from cfdraw.parsers.chakra import IChakra
from cfdraw.app.endpoints.upload import ImageUploader
from cfdraw.app.endpoints.upload import FetchImageModel


class ISocketPlugin(IPlugin, metaclass=ABCMeta):
    @abstractmethod
    async def process(self, data: ISocketRequest) -> Any:
        pass

    # internal APIs

    @property
    def middlewares(self) -> List[IMiddleWare]:
        return [
            ResponseMiddleWare(self),
            TimerMiddleWare(self),
            SendSocketMessageMiddleWare(self),
        ]

    async def __call__(self, data: ISocketRequest) -> ISocketMessage:
        self.extra_responses = {}
        middlewares = self.middlewares
        for middleware in middlewares:
            await middleware.before(data)
        response = await self.process(data)
        for middleware in middlewares:
            response = await middleware(response)
        return response

    def hash_identifier(self, identifier: str) -> str:
        return f"{identifier}.{self.hash}"

    def to_react(self) -> Dict[str, Any]:
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
                plugins.append(p.to_react())
            plugin_info["plugins"] = plugins
        node_constraint = d.pop("nodeConstraint")
        node_constraint_rules = d.pop("nodeConstraintRules")
        node_constraint_validator = d.pop("nodeConstraintValidator")
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
        # src
        if not isinstance(pI, IPluginGroupInfo):
            d.setdefault("src", constants.DEFAULT_PLUGIN_ICON)
        else:
            d.setdefault("src", constants.DEFAULT_PLUGIN_GROUP_ICON)
        # gather
        props = dict(
            pluginInfo=plugin_info,
            renderInfo=d,
            **chakra_props,
        )
        if node_constraint is not None:
            props["nodeConstraint"] = node_constraint
        if node_constraint_rules is not None:
            props["nodeConstraintRules"] = node_constraint_rules
        if node_constraint_validator is not None:
            props["nodeConstraintValidator"] = node_constraint_validator
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
        data = FetchImageModel(url=src, jpeg=False, return_image=True)
        return await ImageUploader.fetch_image(data)

    def send_progress(
        self,
        progress: Optional[float] = None,
        *,
        textList: Optional[List[str]] = None,
        imageList: Optional[List[str]] = None,
    ) -> bool:
        if textList is None and imageList is None:
            intermediate = None
        else:
            intermediate = ISocketIntermediate(textList=textList, imageList=imageList)
        message = ISocketMessage.make_progress(self.task_hash, progress, intermediate)
        return offload_run(self.send_message(message))

    def send_exception(self, message: str) -> bool:
        message = ISocketMessage.make_exception(self.task_hash, message)
        return offload_run(self.send_message(message))


class IInternalSocketPlugin(ISocketPlugin, metaclass=ABCMeta):
    @property
    def type(self) -> PluginType:
        return PluginType._INTERNAL

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(w=1, h=1)


# bindings


class IFieldsPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.FIELDS


class ITextAreaPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.TEXT_AREA


class IQAPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.QA


class IChatPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.CHAT


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
    "IFieldsPlugin",
    "ITextAreaPlugin",
    "IQAPlugin",
    "IChatPlugin",
    "IPluginGroup",
    # deprecated
    "IHttpPlugin",
    "IHttpTextAreaPlugin",
    "IHttpQAPlugin",
    "IHttpFieldsPlugin",
]
