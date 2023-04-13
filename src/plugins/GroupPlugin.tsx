import { observer } from "mobx-react-lite";

import { useSelecting } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import Render from "./components/Render";
import { drawboardPluginFactory } from "./utils/factory";

const GroupEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const { unGroup } = useSelecting("group") ?? {};
  return <Render onFloatingButtonClick={async () => unGroup?.()} {...props} />;
};
const MultiEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const { setGroup } = useSelecting("multiple") ?? {};
  return <Render onFloatingButtonClick={async () => setGroup?.()} {...props} />;
};
drawboardPluginFactory.register("groupEditor")(observer(GroupEditorPlugin));
drawboardPluginFactory.register("multiEditor")(observer(MultiEditorPlugin));
