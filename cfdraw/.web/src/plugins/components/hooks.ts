import { useCallback } from "react";
import { floatingControlEvent } from "./Floating";

export function useClosePanel(id: string) {
  return useCallback(() => floatingControlEvent.emit({ id, expand: false }), [id]);
}
