from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Union
from typing import Optional
from pydantic import Extra
from pydantic import Field
from pydantic import BaseModel


""" This file should be identical to `src/schema/metaFields.ts` """


class FieldType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"
    LIST = "list"
    OBJECT = "object"


class IBaseField(BaseModel):
    props: Optional[Dict[str, Any]] = Field(None, description="Props for the component")

    class Config:
        extra = Extra.forbid
        smart_union = True


class ITextField(IBaseField):
    placeholder: Optional[str] = Field(None, description="Placeholder of the field")
    type: FieldType = Field(FieldType.TEXT, description="Type of the field")


class IImageField(IBaseField):
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
    label: Optional[str] = Field(None, description="The label of the field")
    precision: Optional[int] = Field(None, description="The precision of the field")
    type: FieldType = Field(FieldType.NUMBER, description="Type", const=True)


class ISelectField(IBaseField):
    values: List[str] = Field(..., description="The values of the field")
    default: str = Field(..., description="The default value of the field")
    type: FieldType = Field(FieldType.SELECT, description="Type", const=True)


class IBooleanField(IBaseField):
    default: bool = Field(..., description="The default value of the field")
    type: FieldType = Field(FieldType.BOOLEAN, description="Type", const=True)


class IListField(IBaseField):
    item: "IFieldDefinition" = Field(..., description="The item of the field")
    type: FieldType = Field(FieldType.LIST, description="Type", const=True)


class IObjectField(IBaseField):
    fields: Dict[str, "IFieldDefinition"] = Field(..., description="Sub fields")
    type: FieldType = Field(FieldType.OBJECT, description="Type", const=True)


IFieldDefinition = Union[
    ITextField,
    IImageField,
    INumberField,
    ISelectField,
    IBooleanField,
    IListField,
    IObjectField,
]
IListField.update_forward_refs()
IObjectField.update_forward_refs()


__all__ = [
    "FieldType",
    "ITextField",
    "IImageField",
    "INumberField",
    "ISelectField",
    "IBooleanField",
    "IListField",
    "IObjectField",
]
