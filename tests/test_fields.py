import json

from cfdraw import *
from pathlib import Path


assets_folder = Path(__file__).parent / "assets"
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
    label7=I18NSelectField(
        mapping={
            "option0": I18N(zh="zh_选项0", en="en_option0"),
            "option1": I18N(zh="zh_选项1", en="en_option1"),
            "option2": I18N(zh="zh_选项2", en="en_option2"),
        },
        default="option0",
        label="label7",
        tooltip="label7",
    ),
    label8=ISelectLocalField(
        path=str(assets_folder),
        defaultPlaceholder="None",
        label="label8",
        tooltip="label8",
    ),
    label9=I18NSelectField(
        mapping=str(assets_folder / "test_fields_label9.json"),
        default="option0",
        label="label9",
        tooltip="label9",
    ),
)
list_label = f"label{len(definitions)}"
list_definition = IListField(label=list_label, tooltip=list_label, item=definitions)


class Plugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        od = definitions.copy()
        od[list_label] = list_definition
        return IPluginSettings(
            w=0.8,
            h=0.8,
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
        label7 = data.extraData["label7"]
        label9 = data.extraData["label9"]
        data.extraData["label7"] = definitions["label7"].parse(label7)
        data.extraData["label9"] = definitions["label9"].parse(label9)
        return json.dumps(data.extraData, indent=2, ensure_ascii=False)


register_plugin("fields")(Plugin)
app = App()
