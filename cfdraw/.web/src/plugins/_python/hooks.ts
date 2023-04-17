import { useMemo } from "react";

import { stripHashFromIdentifier } from "@/utils/misc";

export function useIdentifierId(identifier: string): string {
  return useMemo(() => stripHashFromIdentifier(identifier).replaceAll(".", "_"), [identifier]);
}
