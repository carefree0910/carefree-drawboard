import { useCallback, useMemo } from "react";

import { Dictionary, INode } from "@carefree0910/core";

import type { IMeta } from "@/schema/meta";
import type { IDefinitions } from "@/schema/fields";
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
export function useCurrentMeta(node: INode | null, nodes: INode[]): IMeta | undefined {
  return useMemo(() => {
    let currentMeta: IMeta | undefined;
    if (node && node.type !== "group") {
      currentMeta = node.params.meta as IMeta;
    } else if (nodes.length > 1) {
      // main + mask workaround
      const types = new Set(nodes.map((node) => node.type));
      if (types.size === 2 && types.has("path")) {
        for (const node of nodes) {
          if (node.type !== "path" && node.type !== "group") {
            currentMeta = node.params.meta as IMeta;
            break;
          }
        }
      }
    }
    return currentMeta;
  }, [node?.alias, nodes.map((node) => node.alias).join(",")]);
}
