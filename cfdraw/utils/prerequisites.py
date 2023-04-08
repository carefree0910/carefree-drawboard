import os
import sys
import shutil
import subprocess

from types import ModuleType
from importlib import import_module

from cfdraw import constants
from cfdraw.utils import console


def get_app_module(module: str) -> ModuleType:
    sys.path.insert(0, os.getcwd())
    return import_module(module)


def get_yarn() -> str:
    yarn_path = shutil.which("yarn")
    if yarn_path is None:
        raise FileNotFoundError("cfdraw requires yarn to be installed.")
    return yarn_path


def install_frontend_packages() -> None:
    console.rule("[bold]Installing frontend packages")
    subprocess.run([get_yarn()], cwd=constants.PARENT, stdout=subprocess.PIPE)
