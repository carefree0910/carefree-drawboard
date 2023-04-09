import json

from typing import Any
from typing import Dict

from cfdraw import constants


def parse_dict_from(pivot: str, path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        start = False
        target_lines = []
        for line in f:
            line = line.strip()
            if line.startswith(pivot):
                start = True
                target_lines.append("{")
            elif start:
                if line.endswith("};"):
                    target_lines[-1] = target_lines[-1][:-1]  # strip the trailing comma
                    target_lines.append("}")
                    break
                left, right = line.split(": ")
                line = f'"{left}": {right}'
                target_lines.append(line)
    json_str = "".join(target_lines)
    return json.loads(json_str)


def parse_dict_from_ts_constants(pivot: str) -> Dict[str, Any]:
    return parse_dict_from(pivot, constants.TS_CONSTANTS_PATH)
