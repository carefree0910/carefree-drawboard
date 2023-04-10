import json

from typing import Dict
from typing import List
from typing import NamedTuple

from cfdraw import constants
from cfdraw.schema.plugins import IPlugin


class PluginSettingsFileInfo(NamedTuple):
    start_idx: int
    end_idx: int
    lines: List[str]


def _get_plugin_settings_file_info() -> PluginSettingsFileInfo:
    with open(constants.PYTHON_PLUGINS_SETTINGS_PATH, "r") as f:
        lines = []
        start_idx = end_idx = None
        for i, line in enumerate(f):
            lines.append(line)
            line = line.strip()
            if line.startswith("// START PYTHON PLUGIN SETTINGS"):
                start_idx = i
            elif line.startswith("// END PYTHON PLUGIN SETTINGS"):
                end_idx = i
        if start_idx is None or end_idx is None:
            raise ValueError("Could not find start or end of python plugin settings")
    return PluginSettingsFileInfo(start_idx, end_idx, lines)


def _write_plugin_settings(lines: List[str]) -> None:
    with open(constants.PYTHON_PLUGINS_SETTINGS_PATH, "w") as f:
        f.writelines(lines)


def set_plugin_settings(plugins: Dict[str, IPlugin]) -> None:
    info = _get_plugin_settings_file_info()
    before_lines = info.lines[: info.start_idx + 1]
    after_lines = info.lines[info.end_idx :]
    inserted_lines = []
    for identifier, plugin in plugins.items():
        d = plugin.to_plugin_settings(identifier)
        inserted_lines.append(f"  {json.dumps(d)}\n")
    _write_plugin_settings(before_lines + inserted_lines + after_lines)


def reset_plugin_settings() -> None:
    info = _get_plugin_settings_file_info()
    _write_plugin_settings(
        info.lines[: info.start_idx + 1] + info.lines[info.end_idx :]
    )
