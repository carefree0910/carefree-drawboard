import { observer } from "mobx-react-lite";

import { DownloadPanel } from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

const DownloadPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("download").id;
  const closePanel = useClosePanel(id);

  return (
    <Render id={id} {...props}>
      <DownloadPanel onDownload={closePanel} />
    </Render>
  );
};

drawboardPluginFactory.register("download", true)(observer(DownloadPlugin));
