import { observer } from "mobx-react-lite";
import { Input, InputProps } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import type { ISubscribableFields, ITextField } from "@/types/metaFields";
import { metaStore } from "@/stores/meta";

export interface TextFieldProps extends InputProps {
  field: ISubscribableFields;
  definition: ITextField;
}
function TextField({ field, value, onChange, ...props }: TextFieldProps) {
  return (
    <Input
      value={value ?? (metaStore[field] as string)}
      onChange={(event) => {
        metaStore.updateProperty(field, event.target.value);
        onChange?.(event);
      }}
      placeholder={translate(`${field}-field-placeholder`, langStore.tgt)}
      {...props}></Input>
  );
}

export default observer(TextField);
