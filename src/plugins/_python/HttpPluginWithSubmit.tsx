import { useState } from "react";
import { observer } from "mobx-react-lite";

import type { IPythonHttpPluginWithSubmit } from "@/types/_python";
import { useHttpPython } from "@/hooks/usePython";
import { CFButton } from "@/components/CFButton";
import { CFDivider } from "@/components/CFDivider";
import Render from "../components/Render";

const PythonHttpPluginWithSubmit = ({
  pluginInfo: { node, endpoint, identifier, updateInterval },
  buttonText,
  onUseHttpPythonError,
  onUseHttpPythonSuccess,
  beforeRequest,
  getExtraRequestData,
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
    getExtraRequestData,
  });

  return (
    <Render {...props}>
      {children}
      <CFDivider />
      <CFButton onClick={() => setSend(true)}>{buttonText}</CFButton>
    </Render>
  );
};

export default observer(PythonHttpPluginWithSubmit);
