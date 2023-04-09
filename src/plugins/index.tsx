import type { AvailablePlugins, IMakePlugin } from "@/types/plugins";

import { Logger } from "@noli/core";
import { useSelecting } from "@noli/business";

import { isInvisible } from "@/stores/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import { getNodeFilter } from "./utils/renderFilters";

// these lines are needed to make sure the plugins are registered
export * from "./MetaPlugin";
export * from "./Txt2ImgSDPlugin";
export * from "./SettingsPlugin";

export function makePlugin<T extends AvailablePlugins>({
  type,
  props: { requireNode, renderInfo, pluginInfo, ...props },
}: IMakePlugin<T>) {
  if (renderInfo.follow && props.nodeConstraint === "none") {
    Logger.warn("cannot use `follow` with `targetNodeType` set to `none`");
    return null;
  }
  const Plugin = drawboardPluginFactory.get(type);
  if (!Plugin) {
    Logger.warn(`Plugin '${type}' not found`);
    return null;
  }
  let node = null;
  if (requireNode) {
    const info = useSelecting("raw");
    if (!getNodeFilter(props.nodeConstraint)(info)) return null;
    node = info.displayNode;
  }
  const updatedPluginInfo = { ...pluginInfo, node };
  renderInfo.isInvisible = isInvisible(type);
  return <Plugin renderInfo={renderInfo} pluginInfo={updatedPluginInfo} {...props} />;
}
