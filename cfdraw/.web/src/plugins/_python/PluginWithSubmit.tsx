import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonSocketPluginWithSubmit } from "@/schema/_python";
import { Event } from "@/utils/event";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { userStore } from "@/stores/user";
import { getPluginHash } from "@/stores/plugins";
import { setPluginExpanded } from "@/stores/pluginExpanded";
import { useSocketPython } from "@/hooks/usePython";
import { CFButtonWithBusyTooltip } from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import Render from "../components/Render";

export const socketFinishedEvent = new Event<{ id: string }>();
function PythonPluginWithSubmit<R>({
  id,
  pluginInfo: {
    node,
    nodes,
    identifier,
    retryInterval,
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
  const lang = langStore.tgt;
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(() => {
    if (busy) return;
    if (!userStore.canAlwaysSubmit) {
      setBusy(true);
    }
    setHash(getPluginHash(id));
    if (closeOnSubmit) {
      setPluginExpanded(id, false);
    }
    if (toastOnSubmit) {
      toastMessageOnSubmit ??= translate(Toast_Words["submit-task-success-message"], lang);
      toast("info", toastMessageOnSubmit);
    }
  }, [id, lang, closeOnSubmit, toastOnSubmit, toastMessageOnSubmit, busy]);

  useSocketPython<R>({
    hash,
    node,
    nodes,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    retryInterval,
    updateInterval,
    onMessage,
    onSocketError,
    getExtraRequestData,
  });

  useEffect(() => {
    const { dispose } = socketFinishedEvent.on(({ id: incomingId }) => {
      if (incomingId === id) {
        setBusy(false);
        setHash(undefined);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setBusy, setHash]);

  return (
    <Render id={id} {...props}>
      {children}
      <CFDivider />
      <CFButtonWithBusyTooltip
        busy={busy}
        tooltip={Toast_Words["submit-task-busy-message"]}
        onClick={onClick}>
        {buttonText}
      </CFButtonWithBusyTooltip>
    </Render>
  );
}

export default observer(PythonPluginWithSubmit);
