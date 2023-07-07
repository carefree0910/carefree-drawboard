import React from "react";
import { observer } from "mobx-react-lite";

import { isString, isUndefined } from "@carefree0910/core";

import TextField from "./TextField";
import ColorField from "./ColorField";
import ImageField from "./ImageField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";
import { IFieldComponent, injectDefaultFieldProps } from "./utils";
import { IDataCenterKey, getFieldData } from "@/stores/dataCenter";

let Field: React.FC<IFieldComponent> = ({ gap, definition, ...others }) => {
  let Field: any;
  if (definition.type === "text") {
    Field = TextField;
  } else if (definition.type === "number") {
    Field = NumberField;
  } else if (definition.type === "select") {
    Field = SelectField;
  } else if (definition.type === "boolean") {
    Field = BooleanField;
  } else if (definition.type === "color") {
    Field = ColorField;
  } else if (definition.type === "image") {
    Field = ImageField;
  }
  if (!Field) return null;
  if (!isUndefined(definition.condition)) {
    const condition: IDataCenterKey = isString(definition.condition)
      ? { field: definition.condition }
      : definition.condition;
    if (!getFieldData(condition)) return null;
  }
  injectDefaultFieldProps({ gap, definition, ...others });
  return <Field definition={definition} {...others} />;
};

Field = observer(Field);
export { Field };
