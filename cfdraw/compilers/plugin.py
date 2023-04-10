import json

from typing import Dict

from cfdraw import constants
from cfdraw.schema.plugins import IPlugin
from cfdraw.compilers.utils import get_file_info
from cfdraw.compilers.utils import set_file_info


def set_plugin_settings(plugins: Dict[str, IPlugin]) -> None:
    info = get_file_info(
        constants.PYTHON_PLUGINS_SETTINGS_PATH,
        "// START PYTHON PLUGIN SETTINGS",
        "// END PYTHON PLUGIN SETTINGS",
    )
    new_lines = []
    for identifier, plugin in plugins.items():
        d = plugin.to_plugin_settings(identifier)
        new_lines.append(f"  {json.dumps(d)}\n")
    set_file_info(info, new_lines)
