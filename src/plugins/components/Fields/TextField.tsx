import { observer } from "mobx-react-lite";

import { langStore, translate } from "@noli/business";

import type { IField } from "@/types/plugins";
import type { ITextField } from "@/types/metaFields";
import { getMetaField, setMetaField } from "@/stores/meta";
import { CFInput } from "@/components/CFInput";

export interface TextFieldProps extends IField<ITextField> {}
function TextField({ field, definition }: TextFieldProps) {
  return (
    <CFInput
      value={getMetaField(field) as string}
      onChange={(event) => {
        setMetaField(field, event.target.value);
        definition.props?.onChange?.(event);
      }}
      placeholder={translate(`${field}-field-placeholder`, langStore.tgt)}
      {...definition.props}
    />
  );
}

export default observer(TextField);
