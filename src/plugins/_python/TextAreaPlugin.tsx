import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import type { IPythonPlugin } from "@/types/plugins";
import { usePython } from "@/hooks/usePython";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";

const PythonTextAreaPlugin = observer(
  ({ node, endpoint, identifier, updateInterval, ...props }: IPythonPlugin) => {
    const [value, setValue] = useState("");

    usePython<{ text: string }>({
      node,
      endpoint,
      identifier,
      updateInterval,
      onSuccess: async (res) => setValue(res.data.text),
      beforeRequest: async () => setValue("Loading..."),
    });

    return (
      <Render {...props}>
        <Textarea w="100%" h="100%" value={value} readOnly />
      </Render>
    );
  },
);
drawboardPluginFactory.register("_python.textArea", true)(PythonTextAreaPlugin);
