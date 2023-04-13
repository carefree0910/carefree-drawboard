import os

from enum import Enum
from pathlib import Path

# global
DEFAULT_CONFIG_MODULE = "cfconfig"
DEFAULT_MODULE = "app"
DEFAULT_ENTRY = "app"
API_VAR = "api"

# frontend
FRONTEND_PORT = "5123"

# api
ERR_CODE = 406
BACKEND_PORT = "8123"
DEV_BACKEND_HOST = "0.0.0.0"
API_HOST = "http://localhost"


class Endpoint(Enum):
    PING = "ping"
    WEBSOCKET = "ws"

    def __str__(self) -> str:
        return f"/{self.value}"

    __repr__ = __str__


# misc
class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# compiler
ROOT = Path(os.path.dirname(__file__))
PARENT = ROOT.parent.absolute()
SRC_FOLDER = PARENT / "src"
PANELS_FOLDER = SRC_FOLDER / "board"
PYTHON_PLUGINS_SETTINGS_PATH = PANELS_FOLDER / "_python.ts"
TS_CONSTANTS_PATH = SRC_FOLDER / "utils" / "constants.ts"
TS_PYTHON_CONSTANTS_PATH = SRC_FOLDER / "utils" / "_pythonConstants.ts"


# upload
UPLOAD_ROOT = Path("~").expanduser() / ".cache" / "carefree-draw"
UPLOAD_IMAGE_FOLDER_NAME = ".images"
UPLOAD_PROJECT_FOLDER_NAME = ".projects"
