import { observer } from "mobx-react-lite";

import type { IField } from "@/schema/plugins";
import type { ITextField } from "@/schema/fields";
import { getMetaField, setMetaField } from "@/stores/meta";
import CFInput from "@/components/CFInput";
import CFTextarea from "@/components/CFTextarea";
import { getPlaceholder, useDefaultFieldValue } from "./utils";

export interface TextFieldProps extends IField<ITextField> {}
function TextField({ field, definition }: TextFieldProps) {
  useDefaultFieldValue({ field, definition });
  const Input = definition.numRows && definition.numRows > 1 ? CFTextarea : CFInput;

  return (
    <Input
      value={getMetaField(field)}
      onChange={(event) => {
        setMetaField(field, event.target.value);
        definition.props?.onChange?.(event);
      }}
      placeholder={definition.label ?? getPlaceholder(field)}
      {...definition.props}
    />
  );
}

export default observer(TextField);
