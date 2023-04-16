import { observer } from "mobx-react-lite";

import { getRandomHash } from "@noli/core";
import { safeRedo, safeUndo } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const UndoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = `undo_${getRandomHash()}`;
  return <Render id={id} onFloatingButtonClick={async () => safeUndo()} {...props} />;
};
const RedoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = `redo_${getRandomHash()}`;
  return <Render id={id} onFloatingButtonClick={async () => safeRedo()} {...props} />;
};
drawboardPluginFactory.register("undo")(observer(UndoPlugin));
drawboardPluginFactory.register("redo")(observer(RedoPlugin));
