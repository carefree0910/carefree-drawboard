import TextField from "./TextField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";
import { IFieldComponent, injectDefaultFieldProps } from "./utils";

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
  injectDefaultFieldProps({ field, definition, gap });
  return <Field field={field} definition={definition} />;
}
