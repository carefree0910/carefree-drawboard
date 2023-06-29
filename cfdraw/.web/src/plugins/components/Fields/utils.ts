import { useEffect } from "react";

import { isUndefined } from "@carefree0910/core";

import type { IField, IListProperties } from "@/schema/plugins";
import type { IFieldDefinition } from "@/schema/fields";
import { DEFAULT_FIELD_H } from "@/utils/constants";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";

export function useDefaultFieldValue({ definition, ...fieldKeys }: IField<IFieldDefinition>) {
  useEffect(() => {
    if (isUndefined(getMetaField(fieldKeys))) {
      setMetaField(
        fieldKeys,
        definition.type === "text" || definition.type === "image" || definition.type === "color"
          ? parseIStr(definition.default)
          : definition.default,
      );
    }
  }, [fieldKeys]);
}

export interface IFieldComponent {
  gap: number;
  definition: IFieldDefinition;
  onFieldChange?: (value: any) => void;
  onFieldChangeComplete?: (value: any) => void;
  field: string;
  listProperties?: IListProperties;
}
export function getFieldH({ gap, definition, field }: IFieldComponent): number {
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
    fieldH = DEFAULT_FIELD_H * numRows + gap * (numRows - 1);
  }
  return fieldH;
}

export function injectDefaultFieldProps({ gap, definition, field }: IFieldComponent): void {
  const props = definition.props ?? {};
  if (isUndefined(props.w)) props.w = "100%";
  if (isUndefined(props.h)) props.h = `${getFieldH({ gap, definition, field })}px`;
  definition.props = props;
}
