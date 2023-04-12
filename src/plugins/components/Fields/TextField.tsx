import { observer } from "mobx-react-lite";

import { langStore, translate } from "@noli/business";

import type { IField } from "@/types/plugins";
import type { ITextField } from "@/types/metaFields";
import { UI_Words } from "@/lang/ui";
import { getMetaField, setMetaField } from "@/stores/meta";
import { CFInput } from "@/components/CFInput";

export interface TextFieldProps extends IField<ITextField> {}
function TextField({ field, definition }: TextFieldProps) {
  const lang = langStore.tgt;
  const placeholderWord = `${field}-field-placeholder`;

  return (
    <CFInput
      value={getMetaField(field) as string}
      onChange={(event) => {
        setMetaField(field, event.target.value);
        definition.props?.onChange?.(event);
      }}
      placeholder={
        placeholderWord in UI_Words
          ? translate(placeholderWord, lang)
          : field.charAt(0).toUpperCase() + field.slice(1)
      }
      {...definition.props}
    />
  );
}

export default observer(TextField);
