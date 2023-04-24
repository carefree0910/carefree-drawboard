import { useCallback, useMemo } from "react";

import { Dictionary, INode, getRandomHash } from "@carefree0910/core";

import type { IMeta } from "@/schema/meta";
import type { IDefinitions } from "@/schema/metaFields";
import { stripHashFromIdentifier } from "@/utils/misc";
import { getMetaField } from "@/stores/meta";

export function usePureIdentifier(identifier: string): string {
  return useMemo(() => stripHashFromIdentifier(identifier).replaceAll(".", "_"), [identifier]);
}
export function useFieldsPluginIds(identifier: string): { id: string; pureIdentifier: string } {
  const pureIdentifier = usePureIdentifier(identifier);
  const id = useMemo(() => `${pureIdentifier}_${getRandomHash()}`, [pureIdentifier]);
  return { id, pureIdentifier };
}
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
