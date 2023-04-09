from typing import Any
from typing import Dict

from cfdraw import constants
from cfdraw.parsers import utils


def set_constants(updates: Dict[str, Any]) -> None:
    utils.update_dict_with(
        "export const PYTHON_RELATED_SETTINGS = ",
        constants.TS_PYTHON_CONSTANTS_PATH,
        updates,
    )
