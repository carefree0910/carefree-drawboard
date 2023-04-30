import os

from enum import Enum
from pathlib import Path

# global
DEFAULT_CONFIG_MODULE = "cfconfig"
DEFAULT_CONFIG_ENTRY = "config"
DEFAULT_MODULE = "app"
DEFAULT_ENTRY = "app"
API_VAR = "api"

# frontend
FRONTEND_PORT = "5123"

# api
ERR_CODE = 406
BACKEND_PORT = "8123"
DEV_BACKEND_HOST = "0.0.0.0"
API_URL_KEY = "CFDRAW_API_URL"


class Endpoint(Enum):
    PING = "ping"
    WEBSOCKET = "ws"

    def __str__(self) -> str:
        return f"/{self.value}"

    __repr__ = __str__


# misc
ENV_KEY = "CFDRAW_ENV"
UNIFIED_KEY = "CFDRAW_UNIFIED"


class Env(str, Enum):
    DEV = "development"
    PROD = "production"


def get_env() -> Env:
    return os.environ.get(ENV_KEY, Env.DEV)  # type: ignore


def set_env(env: Env) -> None:
    os.environ[ENV_KEY] = env.value


def use_unified() -> bool:
    return os.environ.get(UNIFIED_KEY, None) == "enabled"


def set_unified(enable: bool) -> None:
    os.environ[UNIFIED_KEY] = "enabled" if enable else "disabled"


class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# directories
## common
ROOT = Path(os.path.dirname(__file__))
WEB_ROOT = ROOT / ".web"
## upload
UPLOAD_ROOT = Path("~").expanduser() / ".cache" / "carefree-draw"
UPLOAD_IMAGE_FOLDER_NAME = ".images"
UPLOAD_PROJECT_FOLDER_NAME = ".projects"
PROJECT_META_FILE = "_meta.json"

# icons
TEXT_TO_IMAGE_ICON = "https://user-images.githubusercontent.com/15677328/234642061-98636956-4e3b-44ef-a670-a478bc9eb4ca.svg"
IMAGE_TO_IMAGE_ICON = "https://user-images.githubusercontent.com/15677328/234642045-0416300a-8475-4afa-8285-88c0eee93c07.svg"
IMAGE_TO_TEXT_ICON = "https://user-images.githubusercontent.com/15677328/234642056-79e20fc9-0005-4e0e-8365-3285af8803ae.svg"
CONTROLNET_ICON = IMAGE_TO_IMAGE_ICON
INPAINTING_ICON = IMAGE_TO_IMAGE_ICON
