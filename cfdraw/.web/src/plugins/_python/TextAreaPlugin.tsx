import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";

import type { IPythonTextAreaPlugin, IPythonOnSocketMessage } from "@/schema/_python";
import { usePluginIds } from "@/stores/pluginsInfo";
import { useSocketPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";

const PythonTextAreaPlugin = ({
  pluginInfo: { node, nodes, identifier, retryInterval, updateInterval, noLoading, textAlign },
  ...props
}: IPythonTextAreaPlugin) => {
  const id = usePluginIds(`textArea_${identifier}`);
  const hash = useMemo(() => getRandomHash().toString(), [id]);
  const [value, setValue] = useState("");
  const onMessage = useCallback<IPythonOnSocketMessage<{ text: string }>>(
    async ({ status, data }) => {
      if (status === "finished") {
        setValue(data.final?.text ?? "");
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
