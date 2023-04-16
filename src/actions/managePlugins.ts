import { reactPluginSettings } from "@/_settings";
import { usePythonPluginSettings } from "@/stores/_python";
import { setPluginVisible, setPythonPluginVisible } from "@/stores/plugins";

function setAllPlugins(visible: boolean) {
  reactPluginSettings.forEach(({ type }) => {
    if (type !== "settings") {
      setPluginVisible(type, visible);
    }
  });
  usePythonPluginSettings().forEach(({ props }) => {
    setPythonPluginVisible(props.pluginInfo.identifier, visible);
  });
}

export function hideAllPlugins() {
  setAllPlugins(false);
}
export function showAllPlugins() {
  setAllPlugins(true);
}
