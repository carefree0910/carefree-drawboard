from typing import Any

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.plugins.base import ISocketPlugin


class IPluginGroup(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.PLUGIN_GROUP

    def process(self, data: ISocketRequest) -> Any:
        return


class IFieldsPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.FIELDS


class IWorkflowPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.WORKFLOW


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


class IMarkdownPlugin(ISocketPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.MARKDOWN


__all__ = [
    "IPluginGroup",
    "IFieldsPlugin",
    "IWorkflowPlugin",
    "ITextAreaPlugin",
    "IQAPlugin",
    "IChatPlugin",
    "IMarkdownPlugin",
]
