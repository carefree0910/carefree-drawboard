import { useState } from "react";
import { observer } from "mobx-react-lite";

import type { IField } from "@/schema/plugins";
import type { IBooleanField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFSwitch from "@/components/CFSwitch";
import { useDefaultFieldValue } from "./utils";

function BooleanField({ definition, onFieldChange, ...fieldKeys }: IField<IBooleanField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? definition.default);

  return (
    <CFSwitch
      label={label}
      value={value}
      setValue={(value) => {
        setValue(value);
        setMetaField(fieldKeys, value);
        onFieldChange?.(value);
      }}
      tooltip={tooltip}
      {...definition.props}
    />
  );
}

export default observer(BooleanField);
