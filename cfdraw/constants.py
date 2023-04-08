import os

from enum import Enum
from pathlib import Path

# global
CONFIG_MODULE = "cfconfig"
APP_VAR = "app"
API_VAR = "api"

# socket
CORS_ALLOWED_ORIGINS = "*"
POLLING_MAX_HTTP_BUFFER_SIZE = 1000 * 1000
PING_INTERVAL = 25
PING_TIMEOUT = 5


class SocketEvent(str, Enum):
    PING = "ping"
    EVENT = "event"


# api
ERR_CODE = 406
BACKEND_PORT = "8123"
DEV_BACKEND_HOST = "0.0.0.0"
API_URL = f"http://localhost:{BACKEND_PORT}"


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
SRC_FOLDER = ROOT.parent.absolute() / "src"
PANELS_FOLDER = SRC_FOLDER / "panels"
PYTHON_PLUGINS_SETTINGS_FILE = PANELS_FOLDER / "_python.ts"
TS_CONSTANTS_FILE = SRC_FOLDER / "utils" / "constants.ts"
