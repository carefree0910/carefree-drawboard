import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";

import { getHash } from "@carefree0910/core";

import type { IStr } from "@/schema/misc";
import type { IField } from "@/schema/plugins";
import type { ISelectField } from "@/schema/fields";
import { getBaseURL, titleCaseWord } from "@/utils/misc";
import { userStore } from "@/stores/user";
import { runOneTimeSocketHook } from "@/stores/socket";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
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
    <CFSrollableSelect<IStr, false>
      label={label}
      tooltip={tooltip}
      flexProps={definition.props}
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
  );
}

export default observer(SelectField);
