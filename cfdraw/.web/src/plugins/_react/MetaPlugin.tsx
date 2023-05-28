import { observer } from "mobx-react-lite";

import { shallowCopy } from "@carefree0910/core";
import { useSelecting } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { IS_PROD } from "@/utils/constants";
import { IMeta, getMetaTrace } from "@/schema/meta";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFMarkdown from "@/components/CFMarkdown";
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
  const id = usePluginIds("meta").id;
  const info = useSelecting("raw");
  let meta: IMeta | undefined;
  if (!info || info.type === "group" || info.type === "frame" || info.type === "multiple") {
    others.renderInfo.isInvisible = true;
  } else {
    const _meta = info.displayNode?.params.meta;
    if (!_meta) {
      others.renderInfo.isInvisible = true;
    } else {
      meta = _meta as IMeta;
    }
  }
  meta = shallowCopy(meta);
  const trimMeta = (meta: IMeta | undefined) => {
    if (!!meta && IS_PROD) {
      if (!!meta.data?.response?.extra) {
        delete meta.data.response.extra;
      }
      if (!!meta.data?.injections) {
        delete meta.data.injections;
      }
      trimMeta(meta.data?.from);
    }
  };
  trimMeta(meta);
  const history = meta ? getMetaTrace(meta).reverse().map(getMetaRepresentation).join(" -> ") : "";
  const jsonString = JSON.stringify(meta ?? {}, null, 2);
  const markdown = `**${history}**

~~~json
${jsonString}
~~~
`;

  return (
    <Render id={id} {...others}>
      <CFMarkdown markdown={markdown} />
    </Render>
  );
};

drawboardPluginFactory.register("meta", true)(observer(MetaPlugin));
