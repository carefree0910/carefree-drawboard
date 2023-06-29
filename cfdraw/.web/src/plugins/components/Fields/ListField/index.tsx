import { observer } from "mobx-react-lite";

import { getRandomHash } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { IDefinitions, IListField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { getMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import { getFieldH, useDefaultFieldValue } from "../utils";
import List, { ID_KEY, IListItem } from "./List";

export function getDefaults(item: IDefinitions): IListItem {
  const defaults: IListItem = { [ID_KEY]: getRandomHash().toString() };
  for (const [key, value] of Object.entries(item)) {
    defaults[key] = value.default;
  }
  return defaults;
}

function ListField({ definition, gap, ...fieldKeys }: IField<IListField> & { gap: number }) {
  if (!!fieldKeys.listProperties) {
    throw Error("should not use `ListField` inside another `ListField`");
  }
  useDefaultFieldValue({ definition, ...fieldKeys });
  const field = fieldKeys.field;
  const label = parseIStr(definition.label ?? titleCaseWord(field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const values: IListItem[] | undefined = getMetaField(fieldKeys);

  if (!values) return null;

  definition.numRows = Math.max(1, Math.min(values.length, definition.maxNumRows ?? 4) + 0.5);
  const expandH = getFieldH({ gap, definition, field });

  return (
    <List
      label={label}
      tooltip={tooltip}
      field={field}
      expandH={expandH}
      getNewItem={() => getDefaults(definition.item)}
      getDefinitions={() => definition.item}
      gap={gap}
      getDisplayKey={() => definition.displayKey}
    />
  );
}

export default observer(ListField);
