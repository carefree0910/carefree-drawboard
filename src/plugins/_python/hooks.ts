import { useMemo } from "react";

import { stripHashFromIdentifier } from "@/utils/misc";

export function usePureIdentifier(identifier: string): string {
  return useMemo(() => stripHashFromIdentifier(identifier), [identifier]);
}
