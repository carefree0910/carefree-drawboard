from abc import abstractmethod
from abc import ABCMeta
from typing import Any
from typing import Dict
from typing import List
from typing import Generic
from typing import TypeVar
from typing import Optional
from pydantic import Field
from pydantic import BaseModel

from cfdraw.parsers import noli


TPluginModel = TypeVar("TPluginModel")
TPluginResponse = TypeVar("TPluginResponse", bound="IResponse", covariant=True)


class IConfig:
    # socket
    cors_credentials: bool
    cors_allowed_origins: List[str]
    polling_max_http_buffer_size: int
    ping_interval: int
    ping_timeout: int
    # api
    api_url: str


class IPluginRequest(BaseModel):
    identifier: str = Field(..., description="The identifier of the plugin")
    node: Optional[Dict[str, Any]] = Field(
        ...,
        description="JSON data of the selected node",
    )

    def parse(self) -> "IParsedPluginRequest":
        if self.node is None:
            return self
        d = self.dict()
        d["node"] = noli.parse_node(self.node)
        return IParsedPluginRequest(**d)


class IParsedPluginRequest(IPluginRequest):
    node: Optional[noli.INode] = Field(..., description="The parsed selected node")


class IPlugin(Generic[TPluginResponse], metaclass=ABCMeta):
    identifier: str

    @property
    @abstractmethod
    def settings(self) -> noli.IPluginSettings:
        pass

    @abstractmethod
    def process(self, data: IParsedPluginRequest) -> TPluginResponse:
        pass

    def __call__(self, data: IPluginRequest) -> TPluginResponse:
        return self.process(data.parse())


class IResponse(BaseModel):
    success: bool = Field(..., description="Whether returned successfully")
    message: str = Field(..., description="The message of the response")
    data: BaseModel = Field(..., description="The data of the response")


__all__ = [
    "IPlugin",
    "IParsedPluginRequest",
]
