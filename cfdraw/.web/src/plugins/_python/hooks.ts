import { useCallback, useEffect, useMemo, useState } from "react";

import { Dictionary, INode, getRandomHash, isSingleNode, shallowCopy } from "@carefree0910/core";
import { langStore } from "@carefree0910/business";

import type { IMeta } from "@/schema/meta";
import type { IDefinitions } from "@/schema/fields";
import type {
  IPythonOnPluginMessage,
  IPythonPlugin,
  IUseOnPythonPluginMessage,
  OnPythonPluginMessage,
} from "@/schema/_python";
import { getMetaField } from "@/stores/meta";
import { setPluginMessage, usePluginIds, usePluginNeedRender } from "@/stores/pluginsInfo";
import { useSocketPython } from "@/hooks/usePython";
import { cleanupException, cleanupFinished, cleanupInterrupted } from "../utils/cleanup";
import { socketFinishedEvent } from "./PluginWithSubmit";
import { checkHasConstraint } from "../utils/renderFilters";

export function useDefinitionsRequestDataFn(definitions: IDefinitions): () => Dictionary<any> {
  return useCallback(() => {
    const data: Dictionary<any> = {};
    Object.keys(definitions).forEach((field) => {
      data[field] = getMetaField({ field });
    });
    return data;
  }, [definitions]);
}
export function useCurrentMeta(node: INode | null, nodes: INode[]): IMeta | undefined {
  return useMemo(() => {
    let currentMeta: IMeta | undefined;
    if (node && isSingleNode(node)) {
      currentMeta = node.params.meta as IMeta;
    } else if (nodes.length > 1) {
      // main + mask workaround
      const types = new Set(nodes.map((node) => node.type));
      if (types.size === 2 && types.has("path")) {
        for (const node of nodes) {
          if (node.type !== "path" && isSingleNode(node)) {
            currentMeta = node.params.meta as IMeta;
            break;
          }
        }
      }
    }
    return shallowCopy(currentMeta);
  }, [node?.alias, nodes.map((node) => node.alias).join(",")]);
}
export function useOnMessage({
  id,
  pluginInfo,
  onIntermediate,
  onFinished,
}: IUseOnPythonPluginMessage) {
  const lang = langStore.tgt;
  const { retryInterval, noErrorToast } = pluginInfo;

  return useCallback<IPythonOnPluginMessage>(
    async (message) => {
      switch (message.status) {
        case "pending": {
          setPluginMessage(id, message);
          break;
        }
        case "working": {
          onIntermediate?.(message);
          setPluginMessage(id, message);
          break;
        }
        case "finished": {
          cleanupFinished({ id, message, onFinished });
          break;
        }
        case "exception": {
          cleanupException({ id, message, pluginInfo });
          break;
        }
        case "interrupted": {
          cleanupInterrupted({ id, message });
          break;
        }
      }
      return {};
    },
    [id, lang, retryInterval, noErrorToast, onFinished],
  );
}

interface IUseTextTransfer {
  key: string;
  plugin: IPythonPlugin;
}
export function useTextTransfer({ key, plugin: { pluginInfo, ...props } }: IUseTextTransfer): {
  id: string;
  text: string;
} {
  const { node, nodes, identifier, retryInterval, updateInterval } = pluginInfo;
  const { id } = usePluginIds(`${key}_${identifier}`);
  const needRender = usePluginNeedRender(id);
  const [hash, setHash] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (needRender) {
      setHash(getRandomHash().toString());
    }
  }, [needRender]);
  useEffect(() => {
    const { dispose } = socketFinishedEvent.on(({ id: incomingId }) => {
      if (incomingId === id) {
        setHash(undefined);
      }
    });
    return dispose;
  }, [id, setHash]);
  const [value, setValue] = useState("");
  const onFinished = useCallback<OnPythonPluginMessage>(
    async ({ data: { final } }) => {
      if (final?.type === "text") {
        setValue(final.value[0].text);
      }
    },
    [setValue],
  );
  const onMessage = useOnMessage({ id, pluginInfo, onFinished });
  const hasConstraint = checkHasConstraint(props);

  useSocketPython({
    hash,
    node,
    nodes,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    retryInterval,
    updateInterval,
    onMessage,
    needExportNodeData: hasConstraint,
  });

  return { id, text: value };
}
