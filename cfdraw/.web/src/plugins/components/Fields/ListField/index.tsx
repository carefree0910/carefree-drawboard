import { observer } from "mobx-react-lite";
import { useState } from "react";

import { getRandomHash } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { IDefinitions, IListField } from "@/schema/fields";
import { titleCaseWord } from "@/utils/misc";
import { DEFAULT_FIELD_H } from "@/utils/constants";
import { getMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import { getFieldH, useDefaultFieldValue } from "../utils";
import List, { ID_KEY, IListItem } from "./List";

function getDefaults(item: IDefinitions): IListItem {
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
  const [expanded, setExpanded] = useState(false);

  const values: IListItem[] | undefined = getMetaField(fieldKeys);

  if (!values) return null;

  definition.numRows = Math.max(1, Math.min(values.length, definition.maxNumRows ?? 4) + 0.5);
  const expandH = getFieldH({ gap, definition, field });
  const totalH = DEFAULT_FIELD_H + gap + expandH;

  return (
    <List
      totalH={totalH}
      getNewItem={() => getDefaults(definition.item)}
      setExpanded={setExpanded}
      label={label}
      tooltip={tooltip}
      field={field}
      values={values}
      expanded={expanded}
      getFlexProps={(expanded) =>
        expanded
          ? {
              h: `${expandH}px`,
              mt: "6px",
            }
          : {
              h: "0px",
              mt: "0px",
            }
      }
      getDefinitions={() => definition.item}
      gap={gap}
      getDisplayKey={() => definition.displayKey}
    />
  );
}

export default observer(ListField);
