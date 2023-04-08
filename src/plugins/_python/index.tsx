import { Logger } from "@noli/core";
import { useSelecting } from "@noli/business";

import type { IMakePythonPlugin } from "@/types/_python";
import type { AvailablePythonPlugins } from "@/types/plugins";
import { isInvisible } from "@/stores/plugins";
import { getNodeFilter } from "../utils/renderFilters";
import { drawboardPluginFactory } from "../utils/factory";

export * from "./TextAreaPlugin";

export function makePythonPlugin<T extends AvailablePythonPlugins>({
  key,
  type,
  props: { requireNode, renderInfo, pluginInfo, ...props },
}: IMakePythonPlugin<T> & { key: string }) {
  if (renderInfo.follow && props.nodeConstraint === "none") {
    Logger.warn("cannot use `follow` with `targetNodeType` set to `none`");
    return null;
  }
  const PythonPlugin = drawboardPluginFactory.get(type);
  if (!PythonPlugin) {
    Logger.warn(`Plugin '${type}' not found`);
    return null;
  }
  let node = null;
  if (requireNode) {
    const info = useSelecting("raw");
    if (!getNodeFilter(props.nodeConstraint)(info)) return null;
    node = info.displayNode;
  }
  if (!renderInfo.src)
    renderInfo.src =
      "https://ailab-huawei-cdn.nolibox.com/upload/images/7eb5a38f422049948dc8655123f2d96a.png";
  pluginInfo.node = node;
  renderInfo.isInvisible = isInvisible(type);
  return <PythonPlugin key={key} renderInfo={renderInfo} pluginInfo={pluginInfo} {...props} />;
}
