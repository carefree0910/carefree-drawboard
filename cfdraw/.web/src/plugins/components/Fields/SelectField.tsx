import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import type { IField } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { getMetaField, setMetaField } from "@/stores/meta";
import { CFCaption } from "@/components/CFText";
import { CFSrollableSelect } from "@/components/CFSelect";
import { useDefaultFieldValue } from "./utils";

export interface SelectFieldProps extends IField<ISelectField<string>> {}
function SelectField({ field, definition }: SelectFieldProps) {
  useDefaultFieldValue({ field, definition });

  return (
    <Flex w="100%" h="100%" align="center" {...definition.props}>
      <CFCaption label={definition.label} />
      <Box w="8px" />
      <CFSrollableSelect
        flex={1}
        h="100%"
        value={getMetaField(field) as string}
        options={definition.values as string[]}
        onOptionClick={(value) => setMetaField(field, value)}
      />
    </Flex>
  );
}

export default observer(SelectField);
