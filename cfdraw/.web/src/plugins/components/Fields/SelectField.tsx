import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";

import { Dictionary, getHash } from "@carefree0910/core";

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
  const syncSelect = (extraData: Dictionary<any>) => {
    const hash = getHash(JSON.stringify(extraData)).toString();
    runOneTimeSocketHook<{ options: string[] }>({
      key: "selectField",
      hook: {
        key: hash,
        getMessage: async () => ({
          hash,
          userId,
          userJson,
          baseURL: getBaseURL("_python"),
          identifier: "sync_select_mapping",
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
  };

  useDefaultFieldValue({ definition, ...fieldKeys });
  const userId = userStore.userId;
  const userJson = userStore.json;
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? definition.default);
  const [options, setOptions] = useState(definition.options as IStr[]);
  const onMenuOpen = useCallback(() => {
    if (definition.mappingPath) {
      syncSelect({ mappingPath: definition.mappingPath });
    }
    if (definition.localProperties) {
      syncSelect(definition.localProperties);
    }
  }, [definition.localProperties]);

  const selected = { value: JSON.stringify(value), label: parseIStr(value) };
  const selectOptions = options.map((value) => ({
    value: JSON.stringify(value),
    label: parseIStr(value),
  }));

  return (
    <CFSrollableSelect<string, false>
      fontSize="14px"
      label={label}
      tooltip={tooltip}
      flexProps={definition.props}
      boxProps={{ flex: 1 }}
      value={selected}
      options={selectOptions}
      onMenuOpen={onMenuOpen}
      onChange={(e) => {
        if (!!e) {
          const value = JSON.parse(e.value);
          setValue(value);
          setMetaField(fieldKeys, value);
        }
      }}
    />
  );
}

export default observer(SelectField);
