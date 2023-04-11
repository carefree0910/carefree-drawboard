import { useEffect } from "react";

import { useUndoRedoSteps } from "@noli/business";

import { setVisible } from "@/stores/plugins";

export function useUndoRedo() {
  const { undoSteps, redoSteps } = useUndoRedoSteps();

  useEffect(() => {
    setVisible("undo", undoSteps > 0);
    setVisible("redo", redoSteps > 0);
  }, [undoSteps, redoSteps]);
}
