from enum import Enum
from pathlib import Path
from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import console


IMAGE_APP_TEMPLATE = f"""
from PIL import Image
from PIL import ImageFilter
from cfdraw import *

# This will apply Gaussian Blur to the image
class Plugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=180,
            tooltip="Apply Gaussian Blur to the image",
            nodeConstraint=NodeConstraints.IMAGE,
            follow=True,
            pivot=PivotType.RT,
            pluginInfo=IFieldsPluginInfo(
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

    async def process(self, data: ISocketRequest) -> Image.Image:
        image = await self.load_image(data.nodeData.src)
        return image.filter(ImageFilter.GaussianBlur(data.extraData["size"]))


# This specifies the name of the plugin to be `blur`
# If multiple plugins are used, their names should be unique

register_plugin("blur")(Plugin)
{constants.DEFAULT_ENTRY} = App()
"""

IMAGE_GROUP_APP_TEMPLATE = """
from PIL import Image
from PIL import ImageFilter
from cfdraw import *

# This will apply Gaussian Blur to the image
class Plugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=180,
            tooltip="Apply Gaussian Blur to the image",
            pluginInfo=IFieldsPluginInfo(
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

    async def process(self, data: ISocketRequest) -> Image.Image:
        image = await self.load_image(data.nodeData.src)
        return image.filter(ImageFilter.GaussianBlur(data.extraData["size"]))

# This will group the plugins together
class PluginGroup(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            nodeConstraint=NodeConstraints.IMAGE,
            follow=True,
            pivot=PivotType.RT,
            tooltip="Image processing plugin group",
            pluginInfo=IPluginGroupInfo(
                header="Image Processing",
                plugins=dict(
                    # This specifies the name of the plugin to be `blur`
                    # If multiple plugins are used, their names should be unique
                    blur=Plugin,
                ),
            ),
        )


# This specifies the name of the plugin group to be `group`
# If multiple plugins are used, their names should be unique

register_plugin("group")(PluginGroup)
app = App()
"""

CONFIG_TEMPLATE = f"""
from cfdraw import *

{constants.DEFAULT_CONFIG_ENTRY} = Config(
    # This tells us to use `cwd` to store stuffs (projects, creations, etc.)
    upload_root="./",
)
"""


class TemplateType(str, Enum):
    IMAGE = "image"
    IMAGE_GROUP = "image_group"


app_templates = {
    TemplateType.IMAGE: IMAGE_APP_TEMPLATE,
    TemplateType.IMAGE_GROUP: IMAGE_GROUP_APP_TEMPLATE,
}


def ask_overwrite(path: Path) -> bool:
    if path.is_file():
        console.print(f"Current file already exists: [bold]{path}[/bold].")
        action = console.ask("Overwrite it?", choices=["y", "n"], default="n")
        if action != "y":
            return False
    return True


def set_init_codes(folder: Path, template: TemplateType) -> None:
    codes = app_templates.get(template)
    if codes is None:
        raise ValueError(f"cannot find template for '{template}'")
    app_path = (folder / constants.DEFAULT_MODULE).with_suffix(".py")
    config_path = (folder / constants.DEFAULT_CONFIG_MODULE).with_suffix(".py")
    if not ask_overwrite(app_path):
        return
    with app_path.open("w") as f:
        f.write(codes)
    if not ask_overwrite(config_path):
        return
    with config_path.open("w") as f:
        f.write(CONFIG_TEMPLATE)
    print_info(f"App can be modified at {app_path}")
    print_info(f"Config can be modified at {config_path}")
    console.rule(f"[bold green]🎉 You can launch the app with `cfdraw run` now! 🎉")
