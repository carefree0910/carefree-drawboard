import { useMemo } from "react";

import { Dictionary, INode, getRandomHash } from "@carefree0910/core";

import type { IMeta } from "@/schema/meta";
import type { IDefinitions } from "@/schema/metaFields";
import { stripHashFromIdentifier } from "@/utils/misc";
import { getMetaField } from "@/stores/meta";

export function useIdentifierId(identifier: string): string {
  return useMemo(() => stripHashFromIdentifier(identifier).replaceAll(".", "_"), [identifier]);
}
export function useFieldsPluginIds(identifier: string): { id: string; identifierId: string } {
  const identifierId = useIdentifierId(identifier);
  const id = useMemo(() => `${identifierId}_${getRandomHash()}`, [identifierId]);
  return { id, identifierId };
}
export function useDefinitionsRequestDataFn(definitions: IDefinitions): () => Dictionary<any> {
  return useMemo(
    () => () => {
      const data: Dictionary<any> = {};
      Object.keys(definitions).forEach((field) => {
        data[field] = getMetaField(field);
      });
      return data;
    },
    [definitions],
  );
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
