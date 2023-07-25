import { observer } from "mobx-react-lite";

import { Logger, shallowCopy } from "@carefree0910/core";
import { useSelecting } from "@carefree0910/business";

import type { AllPlugins, IMakePlugin } from "@/schema/plugins";
import { useReactPluginIsVisible, usePythonPluginIsVisible } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "./utils/factory";
import { checkHasConstraint } from "./utils/renderFilters";

// these lines are needed to make sure the plugins are registered
export * from "./_react/MetaPlugin";
export * from "./_react/SettingsPlugin";
export * from "./_react/ProjectPlugin";
export * from "./_react/AddPlugin";
export * from "./_react/ArrangePlugin";
export * from "./_react/UndoRedoPlugin";
export * from "./_react/DownloadPlugin";
export * from "./_react/DeletePlugin";
export * from "./_react/BasicEditorPlugin";
export * from "./_react/TextEditorPlugin";
export * from "./_react/ImageEditorPlugin";
export * from "./_react/SVGEditorPlugin";
export * from "./_react/NoliFrameEditorPlugin";
export * from "./_react/NoliTextFrameEditorPlugin";
export * from "./_react/GroupPlugin";
export * from "./_react/LinksPlugin";
export * from "./_react/ShortcutsPlugin";
export * from "./_react/BrushPlugin";
export * from "./_python/PluginGroup";
export * from "./_python/FieldsPlugin";
export * from "./_python/WorkflowPlugin";
export * from "./_python/TextAreaPlugin";
export * from "./_python/QAPlugin";
export * from "./_python/ChatPlugin";
export * from "./_python/MarkdownPlugin";

function MakePlugin<T extends AllPlugins>({
  type,
  containerRef,
  props: { renderInfo, pluginInfo, ...props },
}: IMakePlugin<T>) {
  renderInfo = shallowCopy(renderInfo);
  pluginInfo = shallowCopy(pluginInfo);
  if (renderInfo.follow && !checkHasConstraint(props)) {
    Logger.warn("cannot use `follow` with no constraints");
    return null;
  }
  const Plugin = drawboardPluginFactory.get(type);
  if (!Plugin) {
    Logger.warn(`Plugin '${type}' not found`);
    return null;
  }
  const info = useSelecting("raw");
  const node = info.displayNode;
  const nodes = info.nodes;
  const updatedPluginInfo = { ...pluginInfo, node, nodes };
  if (drawboardPluginFactory.checkIsPython(type)) {
    renderInfo.isInvisible = !usePythonPluginIsVisible((updatedPluginInfo as any).identifier);
  } else {
    renderInfo.isInvisible = !useReactPluginIsVisible(type);
  }
  return (
    <Plugin
      renderInfo={renderInfo}
      pluginInfo={updatedPluginInfo}
      containerRef={containerRef}
      {...props}
    />
  );
}

export default observer(MakePlugin);
