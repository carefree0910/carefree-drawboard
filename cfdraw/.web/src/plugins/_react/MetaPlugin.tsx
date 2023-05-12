import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { IMeta, getMetaTrace } from "@/schema/meta";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

function getMetaRepresentation(meta: IMeta): string {
  const { type, data } = meta;
  if (type.startsWith("python.")) {
    return data.identifier ?? "unknown";
  }
  return type;
}

const MetaPlugin = ({ pluginInfo, ...others }: IPlugin) => {
  const { id } = usePluginIds("meta");
  const info = useSelecting("raw");
  if (!info || info.type === "group" || info.type === "frame" || info.type === "multiple") {
    return null;
  }
  const _meta = info.displayNode?.params.meta;
  if (!_meta) return null;
  const meta = _meta as IMeta;
  const history = getMetaTrace(meta).reverse().map(getMetaRepresentation).join(" -> ");

  return (
    <Render id={id} {...others}>
      <Textarea
        w="100%"
        h="100%"
        value={`${history}\n\n${JSON.stringify(meta, null, 4)}`}
        readOnly
      />
    </Render>
  );
};

drawboardPluginFactory.register("meta", true)(observer(MetaPlugin));
