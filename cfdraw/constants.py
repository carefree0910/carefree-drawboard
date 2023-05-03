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
SD_INPAINTING_ICON = "https://user-images.githubusercontent.com/15677328/235569053-61e34aa8-d77c-4bee-8dc9-e055141c4afd.svg"
SD_OUTPAINTING_ICON = "https://user-images.githubusercontent.com/15677328/235464888-9d99cf47-1533-4a81-b69d-2b0e18216e64.svg"
SR_ICON = "https://user-images.githubusercontent.com/15677328/235443572-c4fb3900-2381-45bb-8df6-b39e4476f072.svg"
SOD_ICON = "https://user-images.githubusercontent.com/15677328/235569055-197e85ed-b00a-467a-8552-a39a4123bb9e.svg"
INPAINTING_ICON = "https://user-images.githubusercontent.com/15677328/235569047-75da87f3-977c-48ac-8c8d-8a85166369ae.svg"
VARIATION_ICON = "https://user-images.githubusercontent.com/15677328/235648475-f7e18b37-f684-461b-a4b8-76f8096f06c2.svg"
DEFAULT_PLUGIN_ICON = "https://user-images.githubusercontent.com/15677328/234536140-233d5f2d-b6fc-407b-b6df-59b5f37e0bcf.svg"
DEFAULT_PLUGIN_GROUP_ICON = "https://user-images.githubusercontent.com/15677328/235428758-04e6783c-6eaf-47cb-ae4f-b446c9e65412.svg"
