from pathlib import Path
from importlib import import_module
from dataclasses import dataclass

from cfdraw import constants


@dataclass
class Config:
    # app
    entry: str = "app"
    # frontend
    frontend_port: str = constants.FRONTEND_PORT
    # api
    api_host: str = constants.API_HOST
    backend_port: str = constants.BACKEND_PORT
    # upload
    upload_root: str = str(constants.UPLOAD_ROOT)
    # misc
    debug: bool = True
    use_react_strict_mode: bool = False

    @property
    def api_url(self) -> str:
        return f"{self.api_host}:{self.backend_port}"

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


def get_config() -> Config:
    try:
        return import_module(constants.DEFAULT_CONFIG_MODULE).config
    except ImportError:
        return Config()
