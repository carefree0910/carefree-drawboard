import { useEffect } from "react";

import { useUndoRedoSteps } from "@carefree0910/business";

import { setPluginVisible } from "@/stores/pluginVisible";

export function useUndoRedo() {
  const { undoSteps, redoSteps } = useUndoRedoSteps();

  useEffect(() => {
    setPluginVisible("undo", undoSteps > 0);
    setPluginVisible("redo", redoSteps > 0);
  }, [undoSteps, redoSteps]);
}
