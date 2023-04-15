import { observer } from "mobx-react-lite";

import { useSafeExecute, useSelecting } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const DeletePlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const { type, nodes } = useSelecting("raw");
  if (type === "none") return null;
  function onDelete(): void {
    useSafeExecute("remove", null, true)(nodes.map((node) => node.alias));
  }
  return <Render onFloatingButtonClick={async () => onDelete()} {...props} />;
};

const _ = observer(DeletePlugin);
drawboardPluginFactory.register("delete")(_);
export default _;
