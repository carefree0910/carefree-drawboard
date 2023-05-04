import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import type { IField } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFTooltip from "@/components/CFTooltip";
import { CFCaption } from "@/components/CFText";
import { CFSrollableSelect } from "@/components/CFSelect";
import { useDefaultFieldValue } from "./utils";

export interface SelectFieldProps extends IField<ISelectField<string>> {}
function SelectField({ field, definition }: SelectFieldProps) {
  useDefaultFieldValue({ field, definition });
  const label = parseIStr(definition.label ?? titleCaseWord(field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [value, setValue] = useState(getMetaField(field) ?? definition.default);

  return (
    <Flex w="100%" h="100%" align="center" {...definition.props}>
      <CFTooltip label={tooltip}>
        <CFCaption label={label} />
      </CFTooltip>
      <Box w="8px" />
      <CFSrollableSelect
        flex={1}
        h="100%"
        value={value}
        options={definition.values as string[]}
        onOptionClick={(value) => {
          setValue(value);
          setMetaField(field, value);
        }}
      />
    </Flex>
  );
}

export default observer(SelectField);
