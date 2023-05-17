import { isUndefined } from "@carefree0910/core";

import TextField from "./TextField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";
import { IFieldComponent, getFieldH } from "./utils";

export function Field({ field, definition, gap }: IFieldComponent) {
  let Field: any;
  if (definition.type === "text") {
    Field = TextField;
  } else if (definition.type === "number") {
    Field = NumberField;
  } else if (definition.type === "select") {
    Field = SelectField;
  } else if (definition.type === "boolean") {
    Field = BooleanField;
  }
  if (!Field) return null;
  const props = definition.props ?? {};
  if (isUndefined(props.w)) props.w = "100%";
  if (isUndefined(props.h)) props.h = `${getFieldH({ field, definition, gap })}px`;
  definition.props = props;
  return <Field field={field} definition={definition} />;
}
