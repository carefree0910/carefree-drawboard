import { runInAction } from "mobx";

import type { AvailablePluginsAndPythonPlugins } from "@/schema/plugins";
import { reactPluginSettings } from "@/_settings";
import { usePythonPluginSettings } from "@/stores/_python";
import { setPluginVisible, setPythonPluginVisible } from "@/stores/plugins";

function setAllPlugins(visible: boolean, except?: AvailablePluginsAndPythonPlugins[]) {
  runInAction(() => {
    reactPluginSettings.forEach(({ type }) => {
      if (except?.includes(type)) return;
      if (!["settings", "undo", "redo"].includes(type)) {
        setPluginVisible(type, visible);
      }
    });
    usePythonPluginSettings().forEach(({ props }) => {
      const identifier = props.pluginInfo.identifier;
      if (except?.includes(identifier)) return;
      setPythonPluginVisible(identifier, visible);
    });
  });
}

export function hideAllPlugins(opt?: { except?: AvailablePluginsAndPythonPlugins[] }) {
  setAllPlugins(false, opt?.except);
}
export function showAllPlugins(opt?: { except?: AvailablePluginsAndPythonPlugins[] }) {
  setAllPlugins(true, opt?.except);
}
