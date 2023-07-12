import type { Dictionary } from "@carefree0910/core";
import { BoardStore, useSafeExecute } from "@carefree0910/business";

export function updateMeta(alias: string, meta: Dictionary<any>, trace: boolean = true) {
  useSafeExecute("updateMeta", BoardStore.graph.getExistingNode(alias), trace)(meta);
}
