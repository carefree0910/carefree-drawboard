import os
import sys

from types import ModuleType
from importlib import import_module


def get_app_module(module: str) -> ModuleType:
    sys.path.insert(0, os.getcwd())
    return import_module(module)
