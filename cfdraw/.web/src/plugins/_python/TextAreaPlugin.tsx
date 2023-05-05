import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";

import type { IPythonTextAreaPlugin, IPythonOnPluginMessage } from "@/schema/_python";
import { usePluginIds, usePluginNeedRender } from "@/stores/pluginsInfo";
import { useSocketPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";
import { socketFinishedEvent } from "./PluginWithSubmit";
import { cleanupException, cleanupFinished } from "../utils/cleanup";

const PythonTextAreaPlugin = ({ pluginInfo, ...props }: IPythonTextAreaPlugin) => {
  const { node, nodes, identifier, retryInterval, updateInterval, noLoading, textAlign } =
    pluginInfo;
  const { id } = usePluginIds(`textArea_${identifier}`);
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
  const onMessage = useCallback<IPythonOnPluginMessage>(
    async (message) => {
      const { status, data } = message;
      if (status === "finished") {
        if (data.final?.type === "text") {
          setValue(data.final.value[0].text);
        }
        cleanupFinished({ id, message });
      } else if (status === "exception") {
        cleanupException({ id, message, pluginInfo });
      } else if (!noLoading) {
        setValue("Loading...");
      }
      return {};
    },
    [setValue],
  );

  useSocketPython({
    hash,
    node,
    nodes,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    retryInterval,
    updateInterval,
    onMessage,
  });

  return (
    <Render id={id} {...props}>
      <Textarea w="100%" h="100%" minH="0px" value={value} textAlign={textAlign} readOnly />
    </Render>
  );
};

drawboardPluginFactory.registerPython("_python.textArea", true)(observer(PythonTextAreaPlugin));
