import { reactPluginSettings } from "@/_settings";
import { usePythonPluginSettings } from "@/stores/_python";
import { setVisible, setPythonVisible } from "@/stores/plugins";

function setAllPlugins(visible: boolean) {
  reactPluginSettings.forEach(({ type }) => {
    if (type !== "settings") {
      setVisible(type, visible);
    }
  });
  usePythonPluginSettings().forEach(({ props }) => {
    setPythonVisible(props.pluginInfo.identifier, visible);
  });
}

export function hideAllPlugins() {
  setAllPlugins(false);
}
export function showAllPlugins() {
  setAllPlugins(true);
}
