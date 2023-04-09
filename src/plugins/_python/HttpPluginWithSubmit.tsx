import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@chakra-ui/react";

import type { IPythonHttpPluginWithSubmit } from "@/types/plugins";
import { useHttpPython } from "@/hooks/usePython";
import { themeStore } from "@/stores/theme";
import { CFDivider } from "@/components/CFDivider";
import Render from "../components/Render";

const PythonHttpPluginWithSubmit = ({
  pluginInfo: { node, endpoint, identifier, updateInterval },
  buttonText,
  onUseHttpPythonError,
  onUseHttpPythonSuccess,
  beforeRequest,
  getRequestData,
  children,
  ...props
}: IPythonHttpPluginWithSubmit<any>) => {
  const [send, setSend] = useState(false);

  useHttpPython<{ text: string }>({
    node,
    endpoint,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    updateInterval,
    forceNotSend: !send,
    onUseHttpPythonError,
    onUseHttpPythonSuccess,
    beforeRequest: async () => {
      setSend(false);
      beforeRequest && (await beforeRequest());
    },
    getRequestData,
  });

  const { textColor } = themeStore.styles;

  return (
    <Render {...props}>
      {children}
      <CFDivider />
      <Button color={textColor} flexShrink={0} onClick={() => setSend(true)}>
        {buttonText}
      </Button>
    </Render>
  );
};

export default observer(PythonHttpPluginWithSubmit);
