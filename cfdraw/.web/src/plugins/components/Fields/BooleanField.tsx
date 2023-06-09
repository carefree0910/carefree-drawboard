import { useState } from "react";
import { observer } from "mobx-react-lite";

import type { IField } from "@/schema/plugins";
import type { IBooleanField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getFieldData, setFieldData } from "@/stores/dataCenter";
import { parseIStr } from "@/actions/i18n";
import CFSwitch from "@/components/CFSwitch";
import { useDefaultFieldValue } from "./utils";

function BooleanField({
  definition,
  onFieldChange,
  onFieldChangeComplete,
  ...fieldKeys
}: IField<IBooleanField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [value, setValue] = useState(getFieldData(fieldKeys) ?? definition.default);

  return (
    <CFSwitch
      label={label}
      value={value}
      setValue={(value) => {
        setValue(value);
        setFieldData(fieldKeys, value);
        onFieldChange?.(value);
        onFieldChangeComplete?.(value);
      }}
      tooltip={tooltip}
      {...definition.props}
    />
  );
}

export default observer(BooleanField);
