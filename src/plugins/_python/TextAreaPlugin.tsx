import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { Logger } from "@noli/core";

import type { IPythonPlugin } from "@/types/plugins";
import type { IPythonResponse } from "@/types/_python";
import { Requests } from "@/requests/actions";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";

const PythonTextAreaPlugin = observer(({ node, endpoint, identifier, ...props }: IPythonPlugin) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("Loading...");
    Requests.postJson<IPythonResponse<{ text: string }>>("_python", endpoint, {
      node: node?.toJsonPack(),
      identifier,
    })
      .then((res) => {
        if (res.success) setValue(res.data.text);
        else throw Error(res.message);
      })
      .catch((err) => Logger.error(err));
  }, [node, endpoint, identifier]);

  return (
    <Render {...props}>
      <Textarea w="100%" h="100%" value={value} readOnly />
    </Render>
  );
});
drawboardPluginFactory.register("_python.textArea")(PythonTextAreaPlugin);
