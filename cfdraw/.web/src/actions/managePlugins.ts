import { runInAction } from "mobx";

import type { AllPlugins } from "@/schema/plugins";
import { reactPluginSettings } from "@/_settings";
import { usePythonPluginSettings } from "@/stores/settings";
import {
  setPluginExpanded,
  usePluginsExpanded,
  setReactPluginVisible,
  setPythonPluginVisible,
} from "@/stores/pluginsInfo";

function setAllPluginVisible(visible: boolean, except?: AllPlugins[]) {
  runInAction(() => {
    reactPluginSettings.forEach(({ type }) => {
      if (except?.includes(type)) return;
      if (!["settings", "undo", "redo"].includes(type)) {
        setReactPluginVisible(type, visible);
      }
    });
    usePythonPluginSettings().forEach(({ props }) => {
      const identifier = props.pluginInfo.identifier;
      if (except?.includes(identifier)) return;
      setPythonPluginVisible(identifier, visible);
    });
  });
}

export function collapseAllPlugins(opt?: { except?: AllPlugins[] }) {
  runInAction(() => {
    Object.keys(usePluginsExpanded()).forEach((id) => {
      if (opt?.except && opt.except.some((e) => id.startsWith(e))) return;
      setPluginExpanded(id, false);
    });
  });
}
export function hideAllPlugins(opt?: { except?: AllPlugins[] }) {
  // collapse all plugins first
  collapseAllPlugins(opt);
  // then hide all plugins
  setAllPluginVisible(false, opt?.except);
}
export function showAllPlugins() {
  setAllPluginVisible(true);
}
