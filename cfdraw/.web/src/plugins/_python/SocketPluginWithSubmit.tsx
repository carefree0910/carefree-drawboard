import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Tooltip, useToast } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonSocketPluginWithSubmit } from "@/schema/_python";
import { Event } from "@/utils/event";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { userStore } from "@/stores/user";
import { useSocketPython } from "@/hooks/usePython";
import CFButton from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import Render from "../components/Render";
import { floatingControlEvent } from "../components/Floating";

export const socketFinishedEvent = new Event<{ id: string }>();
function PythonSocketPluginWithSubmit<R>({
  id,
  pluginInfo: {
    node,
    nodes,
    endpoint,
    identifier,
    updateInterval,
    closeOnSubmit = true,
    toastOnSubmit = true,
    toastMessageOnSubmit,
  },
  buttonText,
  onMessage,
  onSocketError,
  getExtraRequestData,
  children,
  ...props
}: IPythonSocketPluginWithSubmit<R>) {
  const t = useToast();
  const lang = langStore.tgt;
  const [connect, setConnect] = useState(false);
  const [busy, setBusy] = useState(false);

  useSocketPython<R>({
    t,
    lang,
    connect,
    node,
    nodes,
    endpoint,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    updateInterval,
    onMessage,
    onSocketError,
    getExtraRequestData,
  });

  useEffect(() => {
    const { dispose } = socketFinishedEvent.on(({ id: incomingId }) => {
      if (incomingId === id) {
        setBusy(false);
        setConnect(false);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setBusy, setConnect]);

  function onClick() {
    if (busy) return;
    if (!userStore.canAlwaysSubmit) {
      setBusy(true);
    }
    setConnect(true);
    if (closeOnSubmit) {
      floatingControlEvent.emit({ id, expand: false });
    }
    if (toastOnSubmit) {
      toastMessageOnSubmit ??= translate(Toast_Words["submit-task-success-message"], lang);
      toast(t, "info", toastMessageOnSubmit);
    }
  }

  return (
    <Render id={id} {...props}>
      {children}
      <CFDivider />
      <Tooltip
        label={busy ? translate(Toast_Words["submit-task-busy-message"], lang) : ""}
        shouldWrapChildren>
        <CFButton w="100%" onClick={onClick} isDisabled={busy}>
          {buttonText}
        </CFButton>
      </Tooltip>
    </Render>
  );
}

export default observer(PythonSocketPluginWithSubmit);
