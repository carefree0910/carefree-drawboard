import type { AvailablePluginsAndPythonPlugins, IMakePlugin } from "@/types/plugins";

import { Logger, shallowCopy } from "@noli/core";
import { useSelecting } from "@noli/business";

import { isInvisible, pythonIsInvisible } from "@/stores/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import { getNodeFilter } from "./utils/renderFilters";

// these lines are needed to make sure the plugins are registered
export * from "./MetaPlugin";
export * from "./Txt2ImgSDPlugin";
export * from "./SettingsPlugin";
export * from "./_python/HttpTextAreaPlugin";
export * from "./_python/HttpQAPlugin";
export * from "./_python/HttpFieldsPlugin";

export function makePlugin<T extends AvailablePluginsAndPythonPlugins>({
  key,
  type,
  props: { renderInfo, pluginInfo, ...props },
}: IMakePlugin<T> & { key: string }) {
  renderInfo = shallowCopy(renderInfo);
  pluginInfo = shallowCopy(pluginInfo);
  if (renderInfo.follow && props.nodeConstraint === "none") {
    Logger.warn("cannot use `follow` with `targetNodeType` set to `none`");
    return null;
  }
  const Plugin = drawboardPluginFactory.get(type);
  if (!Plugin) {
    Logger.warn(`Plugin '${type}' not found`);
    return null;
  }
  const info = useSelecting("raw");
  if (!getNodeFilter(props.nodeConstraint)(info)) return null;
  const node = info.displayNode;
  const updatedPluginInfo = { ...pluginInfo, node };
  if (!renderInfo.src)
    renderInfo.src =
      "https://ailab-huawei-cdn.nolibox.com/upload/images/7eb5a38f422049948dc8655123f2d96a.png";
  if (drawboardPluginFactory.checkIsPython(type)) {
    renderInfo.isInvisible = pythonIsInvisible((updatedPluginInfo as any).identifier);
  } else {
    renderInfo.isInvisible = isInvisible(type);
  }
  return <Plugin key={key} renderInfo={renderInfo} pluginInfo={updatedPluginInfo} {...props} />;
}
