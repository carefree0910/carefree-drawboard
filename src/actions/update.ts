import type { Dictionary } from "@noli/core";
import { useSafeExecute } from "@noli/business";

export function updateMeta(alias: string, meta: Dictionary<any>, trace: boolean = true) {
  useSafeExecute("updateMeta", null, trace)({ alias, meta });
}
