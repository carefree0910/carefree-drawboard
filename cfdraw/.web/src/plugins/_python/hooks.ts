import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Dictionary,
  IDefinitions,
  IFieldDefinition,
  INode,
  getRandomHash,
  isSingleNode,
  shallowCopy,
} from "@carefree0910/core";
import { langStore } from "@carefree0910/business";
import { ID_KEY, getFieldData } from "@carefree0910/components";

import type { IMeta } from "@/schema/meta";
import type {
  IPythonOnPluginMessage,
  IPythonPlugin,
  IUseOnPythonPluginMessage,
  OnPythonPluginMessage,
} from "@/schema/_python";
import { IMetaInjections, getMetaInjection } from "@/stores/meta";
import { setPluginMessage, usePluginIds, usePluginNeedRender } from "@/stores/pluginsInfo";
import { useSocketPython } from "@/hooks/usePython";
import { checkHasConstraint } from "../utils/renderFilters";
import { cleanupException, cleanupFinished, cleanupInterrupted } from "../utils/cleanup";
import { socketFinishedEvent } from "./PluginWithSubmit";

export function useDefinitionsRequestDataFn(definitions: IDefinitions): () => Dictionary<any> {
  return useCallback(() => {
    const data: Dictionary<any> = {};
    Object.keys(definitions).forEach((field) => {
      const value = getFieldData({ field });
      if (Array.isArray(value)) {
        value.forEach((obj: any) => {
          if (!!obj[ID_KEY]) {
            delete obj[ID_KEY];
          }
        });
      }
      data[field] = value;
    });
    return data;
  }, [definitions]);
}
export function useDefinitionsGetInjectionsFn(definitions: IDefinitions): () => IMetaInjections {
  return useCallback(() => {
    const _inject = (prefix: string, field: string, definition: IFieldDefinition) => {
      const key = !!prefix ? `${prefix}.${field}` : field;
      if (definition.type !== "list") {
        const injection = getMetaInjection(key);
        if (!!injection) {
          injections[key] = injection;
        }
      } else {
        const definitionValues = getFieldData({ field });
        if (!Array.isArray(definitionValues)) return;
        definitionValues.forEach((_, i) => {
          Object.entries(definition.item).forEach(([itemField, itemDefinition]) => {
            _inject(`${key}.${i}`, itemField, itemDefinition);
          });
        });
      }
    };
    const injections: IMetaInjections = {};
    Object.entries(definitions).forEach(([field, definition]) => _inject("", field, definition));
    return injections;
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
  const { node, nodes, identifier, retryInterval, updateInterval, exportFullImages } = pluginInfo;
  const id = usePluginIds(`${key}_${identifier}`).id;
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
    exportFullImages,
  });

  return { id, text: value };
}
