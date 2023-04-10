import { observer } from "mobx-react-lite";
import { Input, InputProps } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import type { ITextField } from "@/types/metaFields";
import type { IField } from "./_schema";
import { getMetaField, setMetaField } from "@/stores/meta";

export interface TextFieldProps extends InputProps, IField<ITextField> {}
function TextField({ field, value, onChange, ...props }: TextFieldProps) {
  return (
    <Input
      value={value ?? (getMetaField(field) as string)}
      onChange={(event) => {
        setMetaField(field, event.target.value);
        onChange?.(event);
      }}
      placeholder={translate(`${field}-field-placeholder`, langStore.tgt)}
      {...props}></Input>
  );
}

export default observer(TextField);
