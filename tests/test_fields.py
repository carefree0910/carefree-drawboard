import json

from cfdraw import *


definitions = dict(
    label0=ISelectField(
        default="option0",
        options=["option0", "option1", "option2"],
        label="label0",
        tooltip="label0",
    ),
    label1=INumberField(
        default=3,
        min=1,
        max=10,
        step=1,
        isInt=True,
        label="label1",
        tooltip="label1",
    ),
    label2=IImageField(
        default="",
        label="label2",
        tooltip="label2",
    ),
    label3=IColorField(
        default="#aa33aa",
        label="label3",
        tooltip="label3",
    ),
    label4=ITextField(
        default="tExT",
        label="label4",
        tooltip="label4",
    ),
    label5=INumberField(
        default=6,
        label="label5",
        tooltip="label5",
    ),
    label6=IBooleanField(
        default=True,
        label="label6",
        tooltip="label6",
    ),
    label7=ISelectField(
        default="option0",
        options=["option0", "option1", "option2"],
        label="label7",
        tooltip="label7",
    ),
)
list_definition = IListField(label="label8", tooltip="label8", item=definitions)


class Plugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        od = definitions.copy()
        od["label8"] = list_definition
        return IPluginSettings(
            w=800,
            h=800,
            tooltip=(
                "Just display the fields and see if everything is nice looking "
                "and works as expected (When you submit, we will display the "
                "JSON dict of the fields on the drawboard with a text `Node`)."
            ),
            pivot=PivotType.CENTER,
            useModal=True,
            pluginInfo=IFieldsPluginInfo(definitions=od),
        )

    async def process(self, data: ISocketRequest) -> str:
        return json.dumps(data.extraData, indent=2)


register_plugin("fields")(Plugin)
app = App()
