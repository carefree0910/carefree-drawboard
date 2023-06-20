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


class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# env
ENV_KEY = "CFDRAW_ENV"
UNIFIED_KEY = "CFDRAW_UNIFIED"
UPLOAD_ROOT_KEY = "CFDRAW_UPLOAD_ROOT"


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


def get_upload_root() -> str:
    return os.environ.get(UPLOAD_ROOT_KEY, str(UPLOAD_ROOT))


# directories
## common
ROOT = Path(os.path.dirname(__file__))
WEB_ROOT = ROOT / ".web"
## upload
UPLOAD_ROOT = Path("~").expanduser() / ".cache" / "carefree-drawboard" / "_upload"
UPLOAD_IMAGE_FOLDER_NAME = ".images"
UPLOAD_PROJECT_FOLDER_NAME = ".projects"
BUGGY_PROJECT_FOLDER = ".buggy"
PROJECT_META_FILE = "_meta.json"

# plugin

## keys
WORKFLOW_KEY = "$workflow"

## icons
TEXT_TO_IMAGE_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/txt2img.svg"
IMAGE_TO_IMAGE_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/img2img.svg"
IMAGE_TO_TEXT_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/img2txt.svg"
CONTROLNET_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/controlnet.svg"
CONTROLNET_HINT_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/wrench.svg"
SD_INPAINTING_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/sd-inpainting.svg"
SD_OUTPAINTING_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/sd-outpainting.svg"
SR_ICON = (
    "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/sr.svg"
)
SOD_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/sod.svg"
INPAINTING_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/inpainting.svg"
VARIATION_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/variation.svg"
HARMONIZATION_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/sparkle.svg"
PROMPT_ENHANCE_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/text-sparkle.svg"
WORKFLOW_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/workflow.svg"
EXECUTE_WORKFLOW_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/execute-workflow.svg"
DEFAULT_PLUGIN_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/default-plugin.svg"
DEFAULT_PLUGIN_GROUP_ICON = "https://ailab-huawei-cdn.nolibox.com/upload/static/carefree-drawboard/icons/default-plugin-group.svg"
