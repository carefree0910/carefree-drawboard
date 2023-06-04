import os

from typing import Optional
from pathlib import Path
from importlib import import_module
from dataclasses import field
from dataclasses import dataclass

from cfdraw import constants
from cfdraw.utils.cache import cache_resource
from cfdraw.schema.settings import ExtraPlugins
from cfdraw.schema.settings import BoardSettings


@dataclass
class Config:
    # app
    entry: str = constants.DEFAULT_ENTRY
    # frontend
    frontend_port: str = constants.FRONTEND_PORT
    # api
    backend_port: str = constants.BACKEND_PORT
    ## if provided, will be set as `CFDRAW_API_URL`
    backend_hosting_url: Optional[str] = None
    # upload
    upload_root: str = field(default_factory=constants.get_upload_root)
    # board
    board_settings: BoardSettings = field(default_factory=BoardSettings)
    # extra plugins
    extra_plugins: ExtraPlugins = field(default_factory=ExtraPlugins)
    # misc
    use_react_strict_mode: bool = False

    @property
    def prod(self) -> bool:
        return constants.get_env() == constants.Env.PROD

    @property
    def use_unified(self) -> bool:
        return constants.use_unified()

    @property
    def api_port(self) -> str:
        return self.backend_port

    @property
    def api_url(self) -> str:
        if self.backend_hosting_url is not None:
            api_url = self.backend_hosting_url
        else:
            env_api_url = os.environ.get(constants.API_URL_KEY)
            if env_api_url is not None:
                api_url = env_api_url
            else:
                api_url = f"http://localhost:{self.api_port}"
        return api_url.rstrip("/").rstrip("\\")

    @property
    def frontend_url(self) -> str:
        return f"http://localhost:{self.frontend_port}"

    @property
    def upload_root_path(self) -> Path:
        return Path(self.upload_root).absolute()

    @property
    def upload_image_folder(self) -> Path:
        folder = self.upload_root_path / constants.UPLOAD_IMAGE_FOLDER_NAME
        folder.mkdir(parents=True, exist_ok=True)
        return folder

    @property
    def upload_project_folder(self) -> Path:
        folder = self.upload_root_path / constants.UPLOAD_PROJECT_FOLDER_NAME
        folder.mkdir(parents=True, exist_ok=True)
        return folder


@cache_resource
def get_config() -> Config:
    try:
        return getattr(
            import_module(constants.DEFAULT_CONFIG_MODULE),
            constants.DEFAULT_CONFIG_ENTRY,
        )
    except ImportError:
        return Config()
