import { useCallback, useMemo } from "react";

import { Dictionary, INode } from "@carefree0910/core";

import type { IMeta } from "@/schema/meta";
import type { IDefinitions } from "@/schema/metaFields";
import { getMetaField } from "@/stores/meta";

export function useDefinitionsRequestDataFn(definitions: IDefinitions): () => Dictionary<any> {
  return useCallback(() => {
    const data: Dictionary<any> = {};
    Object.keys(definitions).forEach((field) => {
      data[field] = getMetaField(field);
    });
    return data;
  }, [definitions]);
}
export function useCurrentMeta(node: INode | null): IMeta | undefined {
  return useMemo(() => {
    let currentMeta: IMeta | undefined;
    if (node && node.type !== "group") {
      currentMeta = node.params.meta as IMeta;
    }
    return currentMeta;
  }, [node]);
}
