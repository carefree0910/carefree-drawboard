import { observer } from "mobx-react-lite";

import { useSafeExecute, useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const DeletePlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("delete").id;
  const { type, nodes } = useSelecting("raw");
  if (type === "none") {
    props.renderInfo.isInvisible = true;
  }
  function onDelete(): void {
    useSafeExecute("remove", null, true)(nodes.map((node) => node.alias));
  }
  return <Render id={id} onFloatingButtonClick={async () => onDelete()} {...props} />;
};

drawboardPluginFactory.register("delete", true)(observer(DeletePlugin));
