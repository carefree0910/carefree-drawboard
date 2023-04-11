import { observer } from "mobx-react-lite";

import { safeRedo, safeUndo } from "@noli/business";

import type { IPlugin } from "@/types/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const UndoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  return <Render onFloatingButtonClick={async () => safeUndo()} {...props}></Render>;
};
const RedoPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  return <Render onFloatingButtonClick={async () => safeRedo()} {...props}></Render>;
};
drawboardPluginFactory.register("undo")(observer(UndoPlugin));
drawboardPluginFactory.register("redo")(observer(RedoPlugin));
