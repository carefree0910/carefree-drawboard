import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea, useToast } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore } from "@carefree0910/business";

import type { IPythonTextAreaPlugin, IPythonOnSocketMessage } from "@/schema/_python";
import { useSocketPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";
import { useIdentifierId } from "./hooks";

const PythonTextAreaPlugin = ({
  pluginInfo: { node, nodes, endpoint, identifier, updateInterval, noLoading, textAlign },
  ...props
}: IPythonTextAreaPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;
  const identifierId = useIdentifierId(identifier);
  const id = useMemo(() => `${identifierId}_textArea_${getRandomHash()}`, [identifierId]);
  const hash = useMemo(() => getRandomHash().toString(), [id]);
  const [value, setValue] = useState("");
  const onMessage = useCallback<IPythonOnSocketMessage<{ text: string }>>(
    async ({ data: { status, data } }) => {
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
    endpoint,
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
