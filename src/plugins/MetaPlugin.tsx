import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import type { IPlugin } from "@/types/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const MetaPlugin = observer(({ pluginInfo: { node }, ...props }: IPlugin) => {
  if (!node || node.type === "group") return null;
  const meta = node.params.meta;
  if (!meta) return null;

  return (
    <Render {...props}>
      <Textarea w="100%" h="100%" value={JSON.stringify(meta, null, 2)} readOnly />
    </Render>
  );
});
drawboardPluginFactory.register("meta")(MetaPlugin);
