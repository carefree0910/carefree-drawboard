import { observer } from "mobx-react-lite";

import { getRandomHash } from "@noli/core";
import { useSelecting } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import Render from "./components/Render";
import { drawboardPluginFactory } from "./utils/factory";

const GroupEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = `groupEditor_${getRandomHash()}`;
  const { unGroup } = useSelecting("group") ?? {};
  return <Render id={id} onFloatingButtonClick={async () => unGroup?.()} {...props} />;
};
const MultiEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = `multiEditor_${getRandomHash()}`;
  const { setGroup } = useSelecting("multiple") ?? {};
  return <Render id={id} onFloatingButtonClick={async () => setGroup?.()} {...props} />;
};
drawboardPluginFactory.register("groupEditor")(observer(GroupEditorPlugin));
drawboardPluginFactory.register("multiEditor")(observer(MultiEditorPlugin));
