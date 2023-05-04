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
