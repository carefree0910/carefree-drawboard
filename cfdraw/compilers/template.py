from enum import Enum
from pathlib import Path
from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import console


IMAGE_APP_TEMPLATE = f"""
from PIL import Image
from PIL import ImageFilter
from cfdraw import *

# This will perform a Gaussian blur on the image
class Plugin(IHttpFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=180,
            nodeConstraint=NodeConstraints.IMAGE,
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IHttpFieldsPluginInfo(
                definitions=dict(
                    size=INumberField(
                        default=3,
                        min=1,
                        max=10,
                        step=1,
                        isInt=True,
                        label="Size",
                    )
                ),
            ),
        )

    def process(self, data: IPluginRequest) -> Image.Image:
        image = self.load_image(data.nodeData.src)
        return image.filter(ImageFilter.GaussianBlur(data.extraData["size"]))


register_plugin("blur")(Plugin)
register_all_available_plugins()
{constants.DEFAULT_ENTRY} = App()
"""

CONFIG_TEMPLATE = f"""
from cfdraw.config import Config

{constants.DEFAULT_CONFIG_ENTRY} = Config(
    # This tells us to use `cwd` to store stuffs (projects, creations, etc.)
    upload_root="./",
)
"""


class TemplateType(str, Enum):
    IMAGE = "image"


app_templates = {TemplateType.IMAGE: IMAGE_APP_TEMPLATE}


def set_init_codes(folder: Path, template: TemplateType) -> None:
    codes = app_templates.get(template)
    if codes is None:
        raise ValueError(f"cannot find template for '{template}'")
    app_path = (folder / constants.DEFAULT_MODULE).with_suffix(".py")
    config_path = (folder / constants.DEFAULT_CONFIG_MODULE).with_suffix(".py")
    with open(app_path, "w") as f:
        f.write(codes)
    with open(config_path, "w") as f:
        f.write(CONFIG_TEMPLATE)
    print_info(f"App can be modified at {app_path}")
    print_info(f"Config can be modified at {config_path}")
    console.rule(f"[bold green]🎉 You can launch the app with `cfdraw run` now! 🎉")
