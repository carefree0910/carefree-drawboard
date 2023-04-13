import { observer } from "mobx-react-lite";

import { langStore } from "@noli/business";

import type { IField } from "@/schema/plugins";
import type { ITextField } from "@/schema/metaFields";
import { getMetaField, setMetaField } from "@/stores/meta";
import { CFInput } from "@/components/CFInput";
import { getPlaceholder } from "./utils";

export interface TextFieldProps extends IField<ITextField> {}
function TextField({ field, definition }: TextFieldProps) {
  return (
    <CFInput
      value={getMetaField(field) as string}
      onChange={(event) => {
        setMetaField(field, event.target.value);
        definition.props?.onChange?.(event);
      }}
      placeholder={definition.placeholder ?? getPlaceholder(field, langStore.tgt)}
      {...definition.props}
    />
  );
}

export default observer(TextField);
