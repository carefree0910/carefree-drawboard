import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea, useToast } from "@chakra-ui/react";

import { getRandomHash } from "@noli/core";
import { langStore } from "@noli/business";

import type { IPythonHttpTextAreaPlugin } from "@/schema/_python";
import { useHttpPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";
import { useIdentifierId } from "./hooks";

const PythonHttpTextAreaPlugin = ({
  pluginInfo: { node, nodes, endpoint, identifier, updateInterval, noLoading, textAlign },
  ...props
}: IPythonHttpTextAreaPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;
  const identifierId = useIdentifierId(identifier);
  const id = useMemo(() => `${identifierId}_textArea_${getRandomHash()}`, []);
  const [value, setValue] = useState("");

  useHttpPython<{ text: string }>({
    t,
    lang,
    node,
    nodes,
    endpoint,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    updateInterval,
    onUseHttpPythonSuccess: async (res) => setValue(res.data.text),
    beforeRequest: noLoading ? undefined : async () => setValue("Loading..."),
  });

  return (
    <Render id={id} {...props}>
      <Textarea w="100%" h="100%" minH="0px" value={value} textAlign={textAlign} readOnly />
    </Render>
  );
};

const _ = observer(PythonHttpTextAreaPlugin);
drawboardPluginFactory.registerPython("_python.httpTextArea", true)(_);
export default _;
