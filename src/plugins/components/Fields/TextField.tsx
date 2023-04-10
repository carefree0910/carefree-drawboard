import { observer } from "mobx-react-lite";
import { Input } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import type { ITextField } from "@/types/metaFields";
import type { IField } from "./_schema";
import { getMetaField, setMetaField } from "@/stores/meta";

export interface TextFieldProps extends IField<ITextField> {}
function TextField({ field, definition }: TextFieldProps) {
  return (
    <Input
      value={getMetaField(field) as string}
      onChange={(event) => {
        setMetaField(field, event.target.value);
        definition.props?.onChange?.(event);
      }}
      placeholder={translate(`${field}-field-placeholder`, langStore.tgt)}
      {...definition.props}></Input>
  );
}

export default observer(TextField);
