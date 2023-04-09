from abc import abstractmethod
from abc import ABC
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
THttpsResponse = TypeVar("THttpsResponse", bound="IHttpsResponse", covariant=True)


class IConfig:
    # socket
    cors_credentials: bool
    cors_allowed_origins: List[str]
    polling_max_http_buffer_size: int
    ping_interval: int
    ping_timeout: int
    # api
    api_url: str


class IPlugin(ABC):
    identifier: str

    @property
    @abstractmethod
    def settings(self) -> noli.IPluginSettings:
        pass

    @abstractmethod
    def __call__(self, data: Any) -> Any:
        pass


# https


class IHttpsPluginRequest(BaseModel):
    identifier: str = Field(..., description="The identifier of the plugin")
    node: Optional[Dict[str, Any]] = Field(
        None,
        description="JSON data of the selected node",
    )

    def parse(self) -> "IParsedHttpsPluginRequest":
        if self.node is None:
            return self
        d = self.dict()
        d["node"] = noli.parse_node(self.node)
        return IParsedHttpsPluginRequest(**d)


class IParsedHttpsPluginRequest(IHttpsPluginRequest):
    node: Optional[noli.INode] = Field(None, description="The parsed selected node")


class IHttpsResponse(BaseModel):
    success: bool = Field(..., description="Whether returned successfully")
    message: str = Field(..., description="The message of the response")
    data: BaseModel = Field(..., description="The data of the response")


class IHttpsPlugin(Generic[THttpsResponse], IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def process(self, data: IParsedHttpsPluginRequest) -> THttpsResponse:
        pass

    def __call__(self, data: IHttpsPluginRequest) -> THttpsResponse:
        return self.process(data.parse())


# socket


class ISocketPlugin(IPlugin):
    pass


__all__ = [
    "IHttpsPlugin",
    "IParsedHttpsPluginRequest",
    "ISocketPlugin",
]
