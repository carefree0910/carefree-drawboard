import { useCallback } from "react";

import { setPluginExpanded } from "@/stores/pluginExpanded";

export function useClosePanel(id: string) {
  return useCallback(() => setPluginExpanded(id, false), [id]);
}
