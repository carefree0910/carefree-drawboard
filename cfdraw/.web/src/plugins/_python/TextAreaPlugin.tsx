import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import type { IPythonTextAreaPlugin } from "@/schema/_python";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";
import { useTextTransfer } from "./hooks";

const PythonTextAreaPlugin = ({ pluginInfo, ...props }: IPythonTextAreaPlugin) => {
  const { textAlign } = pluginInfo;
  const { id, text } = useTextTransfer({ key: "textArea", plugin: { pluginInfo, ...props } });

  return (
    <Render id={id} {...props}>
      <Textarea w="100%" h="100%" minH="0px" value={text} textAlign={textAlign} readOnly />
    </Render>
  );
};

drawboardPluginFactory.registerPython("_python.textArea", true)(observer(PythonTextAreaPlugin));
