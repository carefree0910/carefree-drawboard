import json

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
from cfdraw.parsers.noli import I18N
from cfdraw.parsers.chakra import IChakra


""" This file should be identical to `src/schema/fields.ts` """


class FieldType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    NUMBER = "number"
    SELECT = "select"
    I18N_SELECT = "i18n_select"
    SELECT_LOCAL = "select_local"
    BOOLEAN = "boolean"
    COLOR = "color"
    LIST = "list"
    OBJECT = "object"


class IListProperties(BaseModel):
    listKey: str
    listIndex: int
    parent: Optional["IListProperties"] = None


class ICondition(BaseModel):
    field: str
    listProperties: Optional[IListProperties] = None


class IBaseField(BaseModel):
    label: Optional[IStr] = Field(None, description="The label of the field")
    tooltip: Optional[IStr] = Field(None, description="The tooltip of the field")
    props: Optional[IChakra] = Field(None, description="Props for the component")
    numRows: Optional[int] = Field(
        None,
        description="Number of rows that will be occupied by this field",
    )
    condition: Optional[Union[str, ICondition]] = Field(
        None,
        description=""""
Whether the field is conditioned on another field (i.e., show this field only when the `condition` field has a `True` value).
> This is useful when the settings are hierarchical. For example, we may want to show the `model` field only when the `useModel` field has a `True` value.
""",
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
    options: List[IStr] = Field(..., description="The options of the field")
    default: IStr = Field(..., description="The default value of the field")
    isMulti: Optional[bool] = Field(None, description="Whether use multi-select")
    type: FieldType = Field(FieldType.SELECT, description="Type", const=True)


class I18NSelectField(IBaseField):
    mapping: Union[Dict[str, I18N], str] = Field(
        ...,
        description=(
            "The mapping of the options. "
            "The key is the 'actual' option, and the value is the i18n object to be displayed\n"
            "> If `str` is provided, it represents the path to the mapping json file."
        ),
    )
    default: str = Field(..., description="The default 'actual' option of the field")
    isMulti: Optional[bool] = Field(None, description="Whether use multi-select")
    type: FieldType = Field(FieldType.I18N_SELECT, description="Type", const=True)

    @staticmethod
    def parse_mapping(mapping: Union[Dict[str, I18N], str]) -> Dict[str, I18N]:
        if isinstance(mapping, dict):
            return mapping
        with open(mapping, "r", encoding="utf-8") as f:
            return {k: I18N(**d) for k, d in json.load(f).items()}

    @staticmethod
    def get_options(mapping: Union[Dict[str, I18N], str]) -> List[I18N]:
        return list(I18NSelectField.parse_mapping(mapping).values())

    def dict(self, **kwargs: Any) -> Dict[str, Any]:
        d = super().dict(**kwargs)
        d["type"] = FieldType.SELECT.value
        mapping, default = map(d.pop, ["mapping", "default"])
        parsed_mapping = self.parse_mapping(mapping)
        d["options"] = self.get_options(parsed_mapping)
        d["default"] = parsed_mapping[default]
        if isinstance(mapping, str):
            d["mappingPath"] = mapping
        return d

    def parse(self, i18n_d: Dict[str, str]) -> Optional[str]:
        i18n = I18N(**i18n_d)
        mapping = self.parse_mapping(self.mapping)
        for k, v in mapping.items():
            if i18n == v:
                return k
        return None


class ISelectLocalField(IBaseField):
    path: str = Field(..., description="The local path you want to read")
    default: Optional[str] = Field(None, description="The default value of the field")
    regex: Optional[str] = Field(None, description="The regex to filter the files")
    noExt: bool = Field(False, description="Whether to remove the extension")
    onlyFiles: bool = Field(True, description="Whether only consider files")
    defaultPlaceholder: Optional[str] = Field(
        None,
        description="If provided, it will be inserted to the first of the options and serve as the default value",
    )
    isMulti: Optional[bool] = Field(None, description="Whether use multi-select")
    type: FieldType = Field(FieldType.SELECT_LOCAL, description="Type", const=True)

    @staticmethod
    def get_options(
        *,
        path: str,
        regex: Optional[str] = None,
        noExt: bool,
        onlyFiles: bool,
        defaultPlaceholder: Optional[str] = None,
    ) -> List[str]:
        p = Path(path)
        if not p.is_dir():
            return [] if defaultPlaceholder is None else [defaultPlaceholder]
        paths = [f for f in p.iterdir() if f]
        if onlyFiles:
            paths = [f for f in paths if f.is_file()]
        if regex:
            paths = [f for f in paths if re.search(regex, f.name)]
        sorted_paths = sorted([f.stem if noExt else f.name for f in paths])
        if defaultPlaceholder is None:
            return sorted_paths
        return [defaultPlaceholder] + sorted_paths

    def dict(self, **kwargs: Any) -> Dict[str, Any]:
        d = super().dict(**kwargs)
        d["type"] = FieldType.SELECT.value
        kw = dict(
            path=d.pop("path"),
            regex=d.pop("regex"),
            noExt=d.pop("noExt"),
            onlyFiles=d.pop("onlyFiles"),
            defaultPlaceholder=d.pop("defaultPlaceholder"),
        )
        options = self.get_options(**kw)
        d["options"] = options
        if d["default"] is None:
            d["default"] = options[0]
        d["isLocal"] = True
        d["localProperties"] = kw
        return d


class IBooleanField(IBaseField):
    default: bool = Field(..., description="The default value of the field")
    type: FieldType = Field(FieldType.BOOLEAN, description="Type", const=True)


class IColorField(IBaseField):
    default: IStr = Field("#ffffff", description="The default value of the field")
    type: FieldType = Field(FieldType.COLOR, description="Type", const=True)


class IListField(IBaseField):
    item: Dict[str, "IFieldDefinition"] = Field(..., description="Definitions")
    default: List[Any] = Field(
        default_factory=lambda: [],
        description="The default items of the field",
    )
    displayKey: Optional[str] = Field(
        None,
        description="The key of the field to be displayed when collapsed",
    )
    maxNumRows: Optional[int] = Field(None, description="Maximum number of rows")
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
    I18NSelectField,
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
    "IListProperties",
    "ICondition",
    "ITextField",
    "IImageField",
    "NumberScale",
    "INumberField",
    "ISelectField",
    "I18NSelectField",
    "ISelectLocalField",
    "IBooleanField",
    "IColorField",
    "IListField",
    "IObjectField",
    "IFieldDefinition",
]
