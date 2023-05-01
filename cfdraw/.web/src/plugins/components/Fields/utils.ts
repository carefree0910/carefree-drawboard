import { useEffect } from "react";

import { isUndefined } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { IFieldDefinition } from "@/schema/fields";
import { getMetaField, setMetaField } from "@/stores/meta";

export function useDefaultFieldValue({ field, definition }: IField<IFieldDefinition>) {
  useEffect(() => {
    if (isUndefined(getMetaField(field))) {
      setMetaField(field, definition.default);
    }
  }, [field, definition]);
}
