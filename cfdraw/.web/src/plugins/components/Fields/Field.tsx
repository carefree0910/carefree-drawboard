import TextField from "./TextField";
import ColorField from "./ColorField";
import ImageField from "./ImageField";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import BooleanField from "./BooleanField";
import { IFieldComponent, injectDefaultFieldProps } from "./utils";

export function Field({ gap, definition, ...others }: IFieldComponent) {
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
  injectDefaultFieldProps({ gap, definition, ...others });
  return <Field definition={definition} {...others} />;
}
