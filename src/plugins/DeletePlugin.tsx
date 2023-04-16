import { useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@carefree0910/core";
import { useSafeExecute, useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const DeletePlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `delete_${getRandomHash()}`, []);
  const { type, nodes } = useSelecting("raw");
  if (type === "none") return null;
  function onDelete(): void {
    useSafeExecute("remove", null, true)(nodes.map((node) => node.alias));
  }
  return <Render id={id} onFloatingButtonClick={async () => onDelete()} {...props} />;
};

const _ = observer(DeletePlugin);
drawboardPluginFactory.register("delete")(_);
export default _;
