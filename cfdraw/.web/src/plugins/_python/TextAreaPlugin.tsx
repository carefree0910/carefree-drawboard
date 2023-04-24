import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea, useToast } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore } from "@carefree0910/business";

import type { IPythonTextAreaPlugin, IPythonOnSocketMessage } from "@/schema/_python";
import { getPluginIds } from "@/stores/plugins";
import { useSocketPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";

const PythonTextAreaPlugin = ({
  pluginInfo: { node, nodes, identifier, updateInterval, noLoading, textAlign },
  ...props
}: IPythonTextAreaPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;
  const id = getPluginIds(`textArea_${identifier}`);
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
    t,
    lang,
    hash,
    node,
    nodes,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
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
