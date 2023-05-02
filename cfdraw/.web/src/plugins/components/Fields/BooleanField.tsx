import { useState } from "react";
import { observer } from "mobx-react-lite";

import type { IField } from "@/schema/plugins";
import type { IBooleanField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getMetaField, setMetaField } from "@/stores/meta";
import CFSwitch from "@/components/CFSwitch";
import { useDefaultFieldValue } from "./utils";

export interface BooleanFieldProps extends IField<IBooleanField> {}
function BooleanField({ field, definition }: BooleanFieldProps) {
  useDefaultFieldValue({ field, definition });
  const [value, setValue] = useState(getMetaField(field) ?? definition.default);

  return (
    <CFSwitch
      label={definition.label ?? titleCaseWord(field)}
      value={value}
      setValue={(value) => {
        setValue(value);
        setMetaField(field, value);
      }}
      tooltip={definition.tooltip}
      {...definition.props}
    />
  );
}

export default observer(BooleanField);
