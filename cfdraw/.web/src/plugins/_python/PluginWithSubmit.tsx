import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IPythonSocketPluginWithSubmit } from "@/schema/_python";
import { Event } from "@/utils/event";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { userStore } from "@/stores/user";
import { useSocketPython } from "@/hooks/usePython";
import { CFButtonWithBusyTooltip } from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import Render from "../components/Render";
import { floatingControlEvent } from "../components/Floating";

export const socketFinishedEvent = new Event<{ id: string }>();
function PythonPluginWithSubmit<R>({
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
  const [hash, setHash] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(() => {
    if (busy) return;
    if (!userStore.canAlwaysSubmit) {
      setBusy(true);
    }
    setHash(getRandomHash());
    if (closeOnSubmit) {
      floatingControlEvent.emit({ id, expand: false });
    }
    if (toastOnSubmit) {
      toastMessageOnSubmit ??= translate(Toast_Words["submit-task-success-message"], lang);
      toast(t, "info", toastMessageOnSubmit);
    }
  }, [id, t, lang, closeOnSubmit, toastOnSubmit, toastMessageOnSubmit, busy]);

  useSocketPython<R>({
    t,
    lang,
    hash: hash?.toString(),
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
        tooltip={translate(Toast_Words["submit-task-busy-message"], lang)}
        onClick={onClick}>
        {buttonText}
      </CFButtonWithBusyTooltip>
    </Render>
  );
}

export default observer(PythonPluginWithSubmit);
