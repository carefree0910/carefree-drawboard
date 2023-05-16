import regex as re

from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Union
from typing import Optional
from pathlib import Path
from pydantic import Extra
from pydantic import Field
from pydantic import BaseModel

from cfdraw.parsers.noli import IStr
from cfdraw.parsers.chakra import IChakra


""" This file should be identical to `src/schema/fields.ts` """


class FieldType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    NUMBER = "number"
    SELECT = "select"
    SELECT_LOCAL = "select_local"
    BOOLEAN = "boolean"
    COLOR = "color"
    LIST = "list"
    OBJECT = "object"


class IBaseField(BaseModel):
    label: Optional[IStr] = Field(None, description="The label of the field")
    tooltip: Optional[IStr] = Field(None, description="The tooltip of the field")
    props: Optional[IChakra] = Field(None, description="Props for the component")
    numRows: Optional[int] = Field(
        None,
        description="Number of rows that will be occupied by this field",
    )

    class Config:
        extra = Extra.forbid
        smart_union = True


class ITextField(IBaseField):
    default: IStr = Field("", description="The default value of the field")
    type: FieldType = Field(FieldType.TEXT, description="Type", const=True)


class IImageField(IBaseField):
    default: IStr = Field("", description="The default value of the field")
    type: FieldType = Field(FieldType.IMAGE, description="Type", const=True)


class NumberScale(str, Enum):
    LINEAR = "linear"
    LOGARITHMIC = "logarithmic"


class INumberField(IBaseField):
    default: float = Field(..., description="The default value of the field")
    min: Optional[float] = Field(None, description="The minimum value of the field")
    max: Optional[float] = Field(None, description="The maximum value of the field")
    step: Optional[float] = Field(None, description="The step of the field")
    isInt: Optional[bool] = Field(None, description="Whether the field is an integer")
    scale: Optional[NumberScale] = Field(None, description="The scale of the field")
    precision: Optional[int] = Field(None, description="The precision of the field")
    type: FieldType = Field(FieldType.NUMBER, description="Type", const=True)


class ISelectField(IBaseField):
    values: List[IStr] = Field(..., description="The values of the field")
    default: IStr = Field(..., description="The default value of the field")
    isMulti: Optional[bool] = Field(None, description="Whether use multi-select")
    type: FieldType = Field(FieldType.SELECT, description="Type", const=True)


class ISelectLocalField(IBaseField):
    path: str = Field(..., description="The local path you want to read")
    default: Optional[str] = Field(None, description="The default value of the field")
    regex: Optional[str] = Field(None, description="The regex to filter the files")
    noExt: bool = Field(False, description="Whether to remove the extension")
    onlyFiles: bool = Field(True, description="Whether only consider files")
    isMulti: Optional[bool] = Field(None, description="Whether use multi-select")
    type: FieldType = Field(FieldType.SELECT_LOCAL, description="Type", const=True)

    @staticmethod
    def get_values(
        *,
        path: str,
        regex: Optional[str] = None,
        noExt: bool,
        onlyFiles: bool,
    ) -> List[str]:
        p = Path(path)
        paths = [f for f in p.iterdir() if f]
        if onlyFiles:
            paths = [f for f in paths if f.is_file()]
        if regex:
            paths = [f for f in paths if re.search(regex, f.name)]
        return [""] + sorted([f.stem if noExt else f.name for f in paths])

    def dict(self, **kwargs: Any) -> Dict[str, Any]:
        d = super().dict(**kwargs)
        d["type"] = FieldType.SELECT.value
        kw = dict(
            path=d.pop("path"),
            regex=d.pop("regex"),
            noExt=d.pop("noExt"),
            onlyFiles=d.pop("onlyFiles"),
        )
        values = self.get_values(**kw)
        d["values"] = values
        if d["default"] is None:
            d["default"] = ""
        d["isLocal"] = True
        d["localProperties"] = kw
        return d


class IBooleanField(IBaseField):
    default: bool = Field(..., description="The default value of the field")
    type: FieldType = Field(FieldType.BOOLEAN, description="Type", const=True)


class IColorField(IBaseField):
    default: IStr = Field("", description="The default value of the field")
    type: FieldType = Field(FieldType.COLOR, description="Type", const=True)


class IListField(IBaseField):
    item: "IFieldDefinition" = Field(..., description="The item of the field")
    default: List[Any] = Field(
        default_factory=lambda: [],
        description="The default items of the field",
    )
    type: FieldType = Field(FieldType.LIST, description="Type", const=True)


class IObjectField(IBaseField):
    fields: Dict[str, "IFieldDefinition"] = Field(..., description="Sub fields")
    default: Dict[str, Any] = Field(
        default_factory=lambda: {},
        description="The default object of the field",
    )
    type: FieldType = Field(FieldType.OBJECT, description="Type", const=True)


IFieldDefinition = Union[
    ITextField,
    IImageField,
    INumberField,
    ISelectField,
    ISelectLocalField,
    IBooleanField,
    IColorField,
    IListField,
    IObjectField,
]
IListField.update_forward_refs()
IObjectField.update_forward_refs()


__all__ = [
    "FieldType",
    "ITextField",
    "IImageField",
    "NumberScale",
    "INumberField",
    "ISelectField",
    "ISelectLocalField",
    "IBooleanField",
    "IColorField",
    "IListField",
    "IObjectField",
    "IFieldDefinition",
]
