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

  return (
    <CFSwitch
      label={definition.label ?? titleCaseWord(field)}
      value={getMetaField(field)}
      setValue={(value) => setMetaField(field, value)}
      tooltip={definition.tooltip}
      {...definition.props}
    />
  );
}

export default observer(BooleanField);
