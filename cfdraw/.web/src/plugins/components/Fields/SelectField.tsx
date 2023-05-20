import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import { getHash } from "@carefree0910/core";

import type { IStr } from "@/schema/misc";
import type { IField } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { getBaseURL, titleCaseWord } from "@/utils/misc";
import { userStore } from "@/stores/user";
import { runOneTimeSocketHook } from "@/stores/socket";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFTooltip from "@/components/CFTooltip";
import { CFLabel } from "@/components/CFText";
import { CFSrollableSelect } from "@/components/CFSelect";
import { useDefaultFieldValue } from "./utils";

function SelectField({ definition, ...fieldKeys }: IField<ISelectField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const userId = userStore.userId;
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? definition.default);
  const [options, setOptions] = useState(definition.values as IStr[]);
  const onMenuOpen = useCallback(() => {
    if (definition.localProperties) {
      const extraData = definition.localProperties;
      const hash = getHash(JSON.stringify(extraData)).toString();
      runOneTimeSocketHook<{ options: string[] }>({
        key: "selectField",
        hook: {
          key: hash,
          getMessage: async () => ({
            hash,
            userId,
            baseURL: getBaseURL(),
            identifier: "sync_local_select",
            nodeData: {},
            nodeDataList: [],
            extraData,
            isInternal: true,
          }),
        },
      }).then((res) => {
        if (res) {
          setOptions(res.options);
        }
      });
    }
  }, [definition.localProperties]);

  const selected = { value, label: parseIStr(value) };
  const selectOptions = options.map((value) => ({ value, label: parseIStr(value) }));

  return (
    <Flex w="100%" h="100%" align="center" {...definition.props}>
      <CFTooltip label={tooltip}>
        <CFLabel label={label} />
      </CFTooltip>
      <Box w="8px" />
      <CFSrollableSelect<IStr, false>
        height="40px"
        boxProps={{ flex: 1 }}
        value={selected}
        options={selectOptions}
        onMenuOpen={onMenuOpen}
        onChange={(e) => {
          if (!!e) {
            setValue(e.value);
            setMetaField(fieldKeys, e.value);
          }
        }}
      />
    </Flex>
  );
}

export default observer(SelectField);
