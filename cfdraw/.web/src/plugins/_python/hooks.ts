import { useMemo } from "react";

import { getRandomHash } from "@carefree0910/core";

import { stripHashFromIdentifier } from "@/utils/misc";

export function useIdentifierId(identifier: string): string {
  return useMemo(() => stripHashFromIdentifier(identifier).replaceAll(".", "_"), [identifier]);
}
export function useFieldsPluginIds(identifier: string): { id: string; identifierId: string } {
  const identifierId = useIdentifierId(identifier);
  const id = useMemo(() => `${identifierId}_${getRandomHash()}`, [identifierId]);
  return { id, identifierId };
}
