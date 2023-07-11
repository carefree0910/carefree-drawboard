import { observer } from "mobx-react-lite";

import { useMeta } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { IS_PROD } from "@/utils/constants";
import { IMeta, getMetaTrace } from "@/schema/meta";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFMarkdown from "@/components/CFMarkdown";
import { drawboardPluginFactory } from "../utils/factory";
import { WORKFLOW_KEY } from "../_python/WorkflowPlugin";
import Render from "../components/Render";

function getMetaRepresentation(meta: IMeta): string {
  const { type, data } = meta;
  if (type.startsWith("python.")) {
    return data.identifier ?? "unknown";
  }
  return type;
}

const DEBUG_META = false;
const DATA_MODEL_KEY = "$data_model";
const MetaPlugin = ({ pluginInfo, ...others }: IPlugin) => {
  const id = usePluginIds("meta").id;
  const { meta } = useMeta({ allowUsePreviousNode: true });
  const trimMeta = (meta: IMeta | undefined) => {
    if (!!meta && (IS_PROD || !DEBUG_META)) {
      if (!!meta.data?.response?.extra) {
        if (!!meta.data.response.extra[WORKFLOW_KEY]) {
          delete meta.data.response.extra[WORKFLOW_KEY];
        }
        if (!!meta.data.response.extra[DATA_MODEL_KEY]) {
          for (const [key, value] of Object.entries(meta.data.response.extra[DATA_MODEL_KEY])) {
            if (
              !value ||
              (Array.isArray(value) && value.length === 0) ||
              (typeof value === "object" && Object.keys(value).length === 0)
            ) {
              delete meta.data.response.extra[DATA_MODEL_KEY][key];
            }
          }
        }
      }
      if (!!meta.data?.injections) {
        delete meta.data.injections;
      }
      if (!!meta.data?.elapsedTimes) {
        meta.data.elapsedTimes = {
          pending: meta.data.elapsedTimes.pending,
          executing: meta.data.elapsedTimes.executing,
          total: meta.data.elapsedTimes.total,
          endTime: meta.data.elapsedTimes.endTime,
        };
      }
      trimMeta(meta.data?.from);
    }
  };
  trimMeta(meta as IMeta);
  const history = meta
    ? getMetaTrace(meta as IMeta)
        .reverse()
        .map(getMetaRepresentation)
        .join(" -> ")
    : "";
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
