import { useCallback } from "react";

import { setPluginExpanded } from "@/stores/pluginsInfo";

export function useClosePanel(id: string) {
  return useCallback(() => setPluginExpanded(id, false), [id]);
}
