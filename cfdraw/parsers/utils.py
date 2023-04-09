import json

from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import NamedTuple

from cfdraw import constants


class ParseResponse(NamedTuple):
    d: Dict[str, Any]
    start_idx: int
    end_idx: int
    all_lines: Optional[List[str]]


def _parse_dict(pivot: str, path: str, require_all_lines: bool) -> ParseResponse:
    with open(path, "r") as f:
        start = False
        all_lines = [] if require_all_lines else None
        target_lines = []
        start_idx = end_idx = 0
        for i, line in enumerate(f):
            if all_lines is not None:
                all_lines.append(line)
            line = line.strip()
            if line.startswith(pivot):
                start = True
                start_idx = i
                target_lines.append("{")
            elif start:
                if line.endswith("};"):
                    target_lines[-1] = target_lines[-1][:-1]  # strip the trailing comma
                    target_lines.append("}")
                    end_idx = i
                    start = False
                    if not require_all_lines:
                        break
                else:
                    left, right = line.split(": ")
                    line = f'"{left}": {right}'
                    target_lines.append(line)
    json_str = "".join(target_lines)
    d = json.loads(json_str)
    return ParseResponse(d, start_idx, end_idx, all_lines)


def parse_dict_from(pivot: str, path: str) -> Dict[str, Any]:
    return _parse_dict(pivot, path, False).d


def parse_dict_from_ts_constants(pivot: str) -> Dict[str, Any]:
    return parse_dict_from(pivot, constants.TS_CONSTANTS_PATH)
