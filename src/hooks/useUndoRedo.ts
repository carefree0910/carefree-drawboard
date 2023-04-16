import { useEffect } from "react";

import { useUndoRedoSteps } from "@noli/business";

import { setPluginVisible } from "@/stores/plugins";

export function useUndoRedo() {
  const { undoSteps, redoSteps } = useUndoRedoSteps();

  useEffect(() => {
    setPluginVisible("undo", undoSteps > 0);
    setPluginVisible("redo", redoSteps > 0);
  }, [undoSteps, redoSteps]);
}
