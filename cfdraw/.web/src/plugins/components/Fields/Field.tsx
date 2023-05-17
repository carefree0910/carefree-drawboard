import { isUndefined } from "@carefree0910/core";

import type { IFieldDefinition } from "@/schema/fields";
import TextField from "./TextField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";

interface IFieldComponent {
  field: string;
  definition: IFieldDefinition;
  gap: number;
}
export function getFieldH({ field, definition, gap }: IFieldComponent): number {
  const defaultH = 42;

  // calculate height, in order to place the field in the shortest column (if needed)
  let fieldH;
  const props = definition.props ?? {};
  if (!isUndefined(props.h)) {
    if (!props.h.endsWith("px")) {
      throw Error(`Field '${field}' height must be in px`);
    }
    fieldH = parseInt(props.h.slice(0, -2));
  } else {
    const numRows = definition.numRows ?? 1;
    fieldH = defaultH * numRows + gap * (numRows - 1);
  }
  return fieldH;
}
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
