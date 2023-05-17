import { useEffect } from "react";

import { isUndefined } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { IFieldDefinition } from "@/schema/fields";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";

export function useDefaultFieldValue({ field, definition }: IField<IFieldDefinition>) {
  useEffect(() => {
    if (isUndefined(getMetaField(field))) {
      setMetaField(
        field,
        definition.type === "text" || definition.type === "image" || definition.type === "color"
          ? parseIStr(definition.default)
          : definition.default,
      );
    }
  }, [field, definition]);
}

export interface IFieldComponent {
  field: string;
  definition: IFieldDefinition;
  gap: number;
}
export function getFieldH({ field, definition, gap }: IFieldComponent): number {
  const defaultH = 42;

  // calculate height, in order to place the field in the shortest column (if needed)
  let fieldH;
  const props = definition.props ?? {};
  if (!isUndefined(props.h)) {
    if (!props.h.endsWith("px")) {
      throw Error(`Field '${field}' height must be in px`);
    }
    fieldH = parseInt(props.h.slice(0, -2));
  } else {
    const numRows = definition.numRows ?? 1;
    fieldH = defaultH * numRows + gap * (numRows - 1);
  }
  return fieldH;
}
