import { observer } from "mobx-react-lite";

import { isUndefined } from "@noli/core";
import { langStore, translate } from "@noli/business";

import type { INumberField } from "@/types/metaFields";
import type { IField } from "./_schema";
import { getMetaField, setMetaField } from "@/stores/meta";
import CFSlider from "@/components/CFSlider";
import TextField from "./TextField";

export interface NumberFieldProps extends IField<INumberField> {}
function NumberField({ field, definition }: NumberFieldProps) {
  if (isUndefined(definition.min) || isUndefined(definition.max)) {
    return <TextField field={field} definition={{ type: "text", props: definition.props }} />;
  }
  if (isUndefined(getMetaField(field))) setMetaField(field, definition.default);
  let step = definition.step;
  if (!isUndefined(step) && definition.isInt) step = Math.round(step);
  return (
    <CFSlider
      min={definition.min}
      max={definition.max}
      step={step}
      value={getMetaField(field) as number}
      onSliderChange={(value) => setMetaField(field, value)}
      scale={definition.scale}
      label={definition.label ?? translate(`${field}-field-label`, langStore.tgt)}
      precision={definition.isInt ? 0 : definition.precision}
      {...definition.props}
    />
  );
}

export default observer(NumberField);
