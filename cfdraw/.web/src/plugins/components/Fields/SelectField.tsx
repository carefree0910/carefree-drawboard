import { observer } from "mobx-react-lite";

import type { IField } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { getMetaField, setMetaField } from "@/stores/meta";
import { CFSrollableSelect } from "@/components/CFSelect";
import { useDefaultFieldValue } from "./utils";

export interface SelectFieldProps extends IField<ISelectField<string>> {}
function SelectField({ field, definition }: SelectFieldProps) {
  useDefaultFieldValue({ field, definition });

  return (
    <CFSrollableSelect
      value={getMetaField(field) as string}
      options={definition.values as string[]}
      onOptionClick={(value) => setMetaField(field, value)}
      {...definition.props}
    />
  );
}

export default observer(SelectField);
