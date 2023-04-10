import json

from typing import Any
from typing import Dict

from cfdraw import constants
from cfdraw.parsers.utils import parse_dict_from
from cfdraw.compilers.utils import get_file_info
from cfdraw.compilers.utils import set_file_info


def set_constants(updates: Dict[str, Any]) -> None:
    existing_d = parse_dict_from("return {", constants.TS_PYTHON_CONSTANTS_PATH)
    need_update = False
    for k, v in updates.items():
        if existing_d.get(k) != v:
            need_update = True
            break
    if not need_update:
        return
    info = get_file_info(
        constants.TS_PYTHON_CONSTANTS_PATH,
        "// START PYTHON RELATED SETTINGS",
        "// END PYTHON RELATED SETTINGS",
    )
    new_lines = [
        "export default function getPythonRelatedSettings(): any {\n",
        f"return {json.dumps(updates, indent=2)};\n",
        "}\n",
    ]
    set_file_info(info, new_lines)
