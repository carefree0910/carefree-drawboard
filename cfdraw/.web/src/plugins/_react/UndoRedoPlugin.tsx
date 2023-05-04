import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@carefree0910/core";
import { safeRedo, safeUndo, useUndoRedoSteps } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { setReactPluginVisible } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const UndoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `undo_${getRandomHash()}`, []);
  const { undoSteps } = useUndoRedoSteps();
  useEffect(() => setReactPluginVisible("undo", undoSteps > 0), [undoSteps]);

  return <Render id={id} onFloatingButtonClick={async () => safeUndo()} {...props} />;
};
const RedoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `redo_${getRandomHash()}`, []);
  const { redoSteps } = useUndoRedoSteps();
  useEffect(() => setReactPluginVisible("redo", redoSteps > 0), [redoSteps]);

  return <Render id={id} onFloatingButtonClick={async () => safeRedo()} {...props} />;
};

drawboardPluginFactory.register("undo", true)(observer(UndoPlugin));
drawboardPluginFactory.register("redo", true)(observer(RedoPlugin));
