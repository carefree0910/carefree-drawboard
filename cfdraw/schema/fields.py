from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Union
from typing import Optional
from pydantic import Extra
from pydantic import Field
from pydantic import BaseModel


""" This file should be identical to `src/types/metaFields.ts` """


class FieldType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"
    LIST = "list"
    OBJECT = "object"


class IBaseField(BaseModel):
    # this should not be changed manually!
    type: FieldType = Field(..., description="Type of the field")
    props: Optional[Dict[str, Any]] = Field(None, description="Props for the component")

    class Config:
        extra = Extra.forbid
        smart_union = True


class ITextField(IBaseField):
    type: FieldType = Field(FieldType.TEXT, description="Type of the field")


class IImageField(IBaseField):
    type: FieldType = Field(FieldType.IMAGE, description="Type of the field")


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
    type: FieldType = Field(FieldType.NUMBER, description="Type of the field")


class ISelectField(IBaseField):
    values: List[str] = Field(..., description="The values of the field")
    default: str = Field(..., description="The default value of the field")
    type: FieldType = Field(FieldType.SELECT, description="Type of the field")


class IBooleanField(IBaseField):
    default: bool = Field(..., description="The default value of the field")
    type: FieldType = Field(FieldType.BOOLEAN, description="Type of the field")


class IListField(IBaseField):
    # it should actually be `IFieldDefinition`
    item: Any = Field(..., description="The item of the field")
    type: FieldType = Field(FieldType.LIST, description="Type of the field")


class IObjectField(IBaseField):
    # it should actually be `Dict[str, IFieldDefinition]`
    item: Any = Field(..., description="The item of the field")
    type: FieldType = Field(FieldType.OBJECT, description="Type of the field")


IFieldDefinition = Union[
    ITextField,
    IImageField,
    INumberField,
    ISelectField,
    IBooleanField,
    IListField,
    IObjectField,
]


class ISubscribableFields(str, Enum):
    W = "w"
    H = "h"
    URL = "url"
    PROMPT = "prompt"
    NEGATIVE_PROMPT = "negative_prompt"
    VERSION = "version"
    SAMPLER = "sampler"
    NUM_STEPS = "num_steps"
    GUIDANCE_SCALE = "guidance_scale"
    SEED = "seed"
    USE_CIRCULAR = "use_circular"
    MAX_WH = "max_wh"
    CLIP_SKIP = "clip_skip"
    VARIATIONS = "variations"
    TOME_INFO = "tome_info"


__all__ = [
    "FieldType",
    "ITextField",
    "IImageField",
    "INumberField",
    "ISelectField",
    "IBooleanField",
    "IListField",
    "IObjectField",
    "ISubscribableFields",
]
