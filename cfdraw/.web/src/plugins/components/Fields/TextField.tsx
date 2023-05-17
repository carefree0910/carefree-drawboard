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

function TextField({ definition, ...fieldKeys }: IField<ITextField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const defaultText = parseIStr(definition.default ?? "");
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? defaultText);
  const isNumber = useMemo(() => !!definition.numberOptions, [definition.numberOptions]);
  const Input = definition.numRows && definition.numRows > 1 ? CFTextarea : CFInput;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = event.target.value;
      setValue(v);
      if (!isNumber) {
        setMetaField(fieldKeys, v);
      }
    },
    [isNumber, fieldKeys, setValue],
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
      setMetaField(fieldKeys, number);
    }
  }, [fieldKeys, value, setValue, definition.numberOptions]);

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
