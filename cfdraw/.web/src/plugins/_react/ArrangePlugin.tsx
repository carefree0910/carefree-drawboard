import { observer } from "mobx-react-lite";

import type { IPlugin } from "@/schema/plugins";
import { usePluginIds } from "@/stores/pluginsInfo";
import { onArrange } from "@/actions/arrange";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const ArrangePlugin = ({ pluginInfo: { nodes }, ...props }: IPlugin) => {
  const id = usePluginIds("arrange").id;

  return (
    <Render
      id={id}
      onFloatingButtonClick={async () => onArrange({ type: "multiple", nodes })}
      {...props}
    />
  );
};
drawboardPluginFactory.register("arrange", true)(observer(ArrangePlugin));
