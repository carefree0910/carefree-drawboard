import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";

import { isUndefined } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { ITextField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFInput from "@/components/CFInput";
import CFTextarea from "@/components/CFTextarea";
import { useDefaultFieldValue } from "./utils";

export interface TextFieldProps extends IField<ITextField> {}
function TextField({ field, definition }: TextFieldProps) {
  useDefaultFieldValue({ field, definition });
  const label = parseIStr(definition.label ?? titleCaseWord(field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const defaultText = parseIStr(definition.default ?? "");
  const [value, setValue] = useState(getMetaField(field) ?? defaultText);
  const isNumber = useMemo(() => !!definition.numberOptions, [definition.numberOptions]);
  const Input = definition.numRows && definition.numRows > 1 ? CFTextarea : CFInput;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = event.target.value;
      setValue(v);
      if (!isNumber) {
        setMetaField(field, v);
      }
    },
    [isNumber, field, setValue],
  );
  const onBlur = useCallback(() => {
    if (definition.numberOptions) {
      let number = +value;
      const options = definition.numberOptions;
      if (isNaN(number)) number = 0;
      if (!isUndefined(options.min)) {
        number = Math.max(number, options.min);
      }
      if (!isUndefined(options.max)) {
        number = Math.min(number, options.max);
      }
      if (options.isInt) {
        number = Math.round(number);
      }
      setValue(number.toString());
      setMetaField(field, number);
    }
  }, [field, value, setValue, definition.numberOptions]);

  return (
    <Input
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      tooltip={tooltip}
      placeholder={label}
      {...definition.props}
    />
  );
}

export default observer(TextField);
