import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";

import type { IPythonTextAreaPlugin, OnPythonPluginMessage } from "@/schema/_python";
import { usePluginIds, usePluginNeedRender } from "@/stores/pluginsInfo";
import { useSocketPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";
import { checkHasConstraint } from "../utils/renderFilters";
import { socketFinishedEvent } from "./PluginWithSubmit";
import { useOnMessage } from "./hooks";

const PythonTextAreaPlugin = ({ pluginInfo, ...props }: IPythonTextAreaPlugin) => {
  const { node, nodes, identifier, retryInterval, updateInterval, textAlign } = pluginInfo;
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

  return (
    <Render id={id} {...props}>
      <Textarea w="100%" h="100%" minH="0px" value={value} textAlign={textAlign} readOnly />
    </Render>
  );
};

drawboardPluginFactory.registerPython("_python.textArea", true)(observer(PythonTextAreaPlugin));
