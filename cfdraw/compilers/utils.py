from typing import List
from typing import NamedTuple


class FileInfo(NamedTuple):
    path: str
    start_idx: int
    end_idx: int
    lines: List[str]


def get_file_info(path: str, start_pivot: str, end_pivot: str) -> FileInfo:
    with open(path, "r") as f:
        lines = []
        start_idx = end_idx = None
        for i, line in enumerate(f):
            lines.append(line)
            line = line.strip()
            if line.startswith(start_pivot):
                start_idx = i
            elif line.startswith(end_pivot):
                end_idx = i
        if start_idx is None or end_idx is None:
            raise ValueError("Could not find start or end of python plugin settings")
    return FileInfo(path, start_idx, end_idx, lines)


def set_file_info(info: FileInfo, new_lines: List[str]) -> None:
    before_lines = info.lines[: info.start_idx + 1]
    after_lines = info.lines[info.end_idx :]
    with open(info.path, "w") as f:
        f.writelines(before_lines + new_lines + after_lines)
