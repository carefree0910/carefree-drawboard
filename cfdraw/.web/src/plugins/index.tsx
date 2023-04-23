import { Logger, shallowCopy } from "@carefree0910/core";
import { useSelecting } from "@carefree0910/business";

import type { AvailablePluginsAndPythonPlugins, IMakePlugin } from "@/schema/plugins";
import { pluginIsVisible, pythonPluginIsVisible } from "@/stores/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import { getNodeFilter } from "./utils/renderFilters";

// these lines are needed to make sure the plugins are registered
export * from "./MetaPlugin";
export * from "./SettingsPlugin";
export * from "./ProjectPlugin";
export * from "./AddPlugin";
export * from "./ArrangePlugin";
export * from "./UndoRedoPlugin";
export * from "./DownloadPlugin";
export * from "./DeletePlugin";
export * from "./TextEditorPlugin";
export * from "./GroupPlugin";
export * from "./LinksPlugin";
export * from "./BrushPlugin";
export * from "./_python/TextAreaPlugin";
export * from "./_python/QAPlugin";
export * from "./_python/FieldsPlugin";
export * from "./_python/HttpFieldsPlugin";

export function makePlugin<T extends AvailablePluginsAndPythonPlugins>({
  key,
  type,
  containerRef,
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
  const nodes = info.nodes;
  const updatedPluginInfo = { ...pluginInfo, node, nodes };
  if (!renderInfo.src)
    renderInfo.src =
      "https://ailab-huawei-cdn.nolibox.com/upload/images/7eb5a38f422049948dc8655123f2d96a.png";
  if (drawboardPluginFactory.checkIsPython(type)) {
    renderInfo.isInvisible = !pythonPluginIsVisible((updatedPluginInfo as any).identifier);
  } else {
    renderInfo.isInvisible = !pluginIsVisible(type);
  }
  return (
    <Plugin
      key={key}
      renderInfo={renderInfo}
      pluginInfo={updatedPluginInfo}
      containerRef={containerRef}
      {...props}
    />
  );
}
