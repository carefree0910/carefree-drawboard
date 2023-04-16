import { useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@carefree0910/core";
import { safeRedo, safeUndo } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const UndoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `undo_${getRandomHash()}`, []);
  return <Render id={id} onFloatingButtonClick={async () => safeUndo()} {...props} />;
};
const RedoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `redo_${getRandomHash()}`, []);
  return <Render id={id} onFloatingButtonClick={async () => safeRedo()} {...props} />;
};
drawboardPluginFactory.register("undo")(observer(UndoPlugin));
drawboardPluginFactory.register("redo")(observer(RedoPlugin));
