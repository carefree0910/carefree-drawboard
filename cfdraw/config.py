from typing import List
from importlib import import_module
from dataclasses import field
from dataclasses import dataclass

from cfdraw import constants
from cfdraw.schema import IConfig


@dataclass
class Config(IConfig):
    # frontend
    frontend_port: str = constants.FRONTEND_PORT
    # api
    api_host: str = constants.API_HOST
    backend_port: str = constants.BACKEND_PORT
    # misc
    debug: bool = True
    use_react_strict_mode: bool = False

    @property
    def api_url(self) -> str:
        return f"{self.api_host}:{self.backend_port}"

    @property
    def default_module(self) -> str:
        return "app"


def get_config() -> Config:
    try:
        return import_module(constants.CONFIG_MODULE).config
    except ImportError:
        return Config()
