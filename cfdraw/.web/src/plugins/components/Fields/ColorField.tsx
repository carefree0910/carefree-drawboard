import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ColorChangeHandler } from "react-color";

import type { IField } from "@/schema/plugins";
import type { IColorField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFColorPicker from "@/components/CFColorPicker";
import { useDefaultFieldValue } from "./utils";

function ColorField({ definition, ...fieldKeys }: IField<IColorField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const defaultColor = parseIStr(definition.default ?? "");
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? defaultColor);
  const onChange: ColorChangeHandler = (color) => {
    setValue(color.hex);
    setMetaField(fieldKeys, color.hex);
  };

  return (
    <CFColorPicker
      label={label}
      tooltip={tooltip}
      formProps={{ control: definition.props }}
      color={value}
      onChange={onChange}
    />
  );
}

export default observer(ColorField);