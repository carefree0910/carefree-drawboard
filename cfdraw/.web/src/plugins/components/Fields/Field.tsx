import TextField from "./TextField";
import ColorField from "./ColorField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";
import { IFieldComponent, injectDefaultFieldProps } from "./utils";

export function Field({ gap, definition, ...fieldKeys }: IFieldComponent) {
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
  }
  if (!Field) return null;
  injectDefaultFieldProps({ gap, definition, ...fieldKeys });
  return <Field definition={definition} {...fieldKeys} />;
}
