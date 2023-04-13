import { useState, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@noli/core";

import type { IPythonHttpPluginWithSubmit } from "@/types/_python";
import { useHttpPython } from "@/hooks/usePython";
import { CFButton } from "@/components/CFButton";
import { CFDivider } from "@/components/CFDivider";
import Render from "../components/Render";
import { floatingControlEvent } from "../components/Floating";

const PythonHttpPluginWithSubmit = ({
  id,
  pluginInfo: { node, endpoint, identifier, updateInterval, closeOnSubmit = true },
  buttonText,
  onUseHttpPythonError,
  onUseHttpPythonSuccess,
  beforeRequest,
  getExtraRequestData,
  children,
  ...props
}: IPythonHttpPluginWithSubmit<any>) => {
  const [send, setSend] = useState(false);
  const _id = useMemo(() => id ?? `pythonHttpPluginWithSubmit_${getRandomHash()}`, [id]);

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
    <Render id={_id} {...props}>
      {children}
      <CFDivider />
      <CFButton
        onClick={() => {
          setSend(true);
          if (closeOnSubmit) {
            floatingControlEvent.emit({ id: _id, expand: false });
          }
        }}>
        {buttonText}
      </CFButton>
    </Render>
  );
};

export default observer(PythonHttpPluginWithSubmit);
