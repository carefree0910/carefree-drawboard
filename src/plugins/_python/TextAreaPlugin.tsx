import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import type { IPythonTextAreaPlugin } from "@/types/plugins";
import { useHttpPython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";

const PythonTextAreaPlugin = ({
  pluginInfo: { node, endpoint, identifier, updateInterval, noLoading, textAlign },
  ...props
}: IPythonTextAreaPlugin) => {
  const [value, setValue] = useState("");

  useHttpPython<{ text: string }>({
    node,
    endpoint,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    updateInterval,
    onSuccess: async (res) => setValue(res.data.text),
    beforeRequest: noLoading ? undefined : async () => setValue("Loading..."),
  });

  return (
    <Render {...props}>
      <Textarea w="100%" h="100%" minH="0px" value={value} textAlign={textAlign} readOnly />
    </Render>
  );
};
drawboardPluginFactory.registerPython("_python.textArea", true)(observer(PythonTextAreaPlugin));
