import { useState } from "react";
import { observer } from "mobx-react-lite";

import { isUndefined } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { INumberField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getFieldData, setFieldData } from "@/stores/dataCenter";
import { parseIStr } from "@/actions/i18n";
import CFSlider from "@/components/CFSlider";
import TextField from "./TextField";
import { useDefaultFieldValue } from "./utils";

function NumberField({
  definition,
  onFieldChange,
  onFieldChangeComplete,
  ...fieldKeys
}: IField<INumberField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const [value, setValue] = useState(getFieldData(fieldKeys) ?? definition.default);

  if (isUndefined(definition.min) || isUndefined(definition.max)) {
    const tooltip = parseIStr(definition.tooltip ?? label);
    return (
      <TextField
        definition={{
          type: "text",
          default: definition.default.toString(),
          label: definition.label,
          tooltip,
          props: definition.props,
          numberOptions: {
            min: definition.min,
            max: definition.max,
            isInt: definition.isInt,
          },
          inList: definition.inList,
        }}
        onFieldChange={onFieldChange}
        onFieldChangeComplete={onFieldChangeComplete}
        {...fieldKeys}
      />
    );
  }

  let step = definition.step;
  if (!isUndefined(step) && definition.isInt) step = Math.round(step);
  const tooltip = parseIStr(definition.tooltip ?? "");

  return (
    <CFSlider
      min={definition.min}
      max={definition.max}
      step={step}
      value={value}
      onSliderChange={(value) => {
        setValue(value);
        setFieldData(fieldKeys, value);
        onFieldChange?.(value);
      }}
      onSliderChangeComplete={(value) => onFieldChangeComplete?.(value)}
      scale={definition.scale}
      label={label}
      tooltip={tooltip}
      precision={definition.isInt ? 0 : definition.precision}
      {...definition.props}
    />
  );
}

export default observer(NumberField);
