import { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import type { IPythonHttpPluginWithSubmit } from "@/schema/_python";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { useHttpPython } from "@/hooks/usePython";
import { CFButtonWithBusyTooltip } from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import Render from "../components/Render";
import { floatingControlEvent } from "../components/Floating";
import { userStore } from "@/stores/user";

function PythonHttpPluginWithSubmit<R>({
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
  onUseHttpPythonError,
  onUseHttpPythonSuccess,
  beforeRequest,
  afterResponse,
  getExtraRequestData,
  children,
  ...props
}: IPythonHttpPluginWithSubmit<R>) {
  const t = useToast();
  const lang = langStore.tgt;
  const [send, setSend] = useState(false);
  const onClick = useCallback(() => {
    setSend(true);
    if (closeOnSubmit) {
      floatingControlEvent.emit({ id, expand: false });
    }
    if (toastOnSubmit) {
      toastMessageOnSubmit ??= translate(Toast_Words["submit-task-success-message"], lang);
      toast(t, "info", toastMessageOnSubmit);
    }
  }, [id, t, lang, closeOnSubmit, toastOnSubmit, toastMessageOnSubmit]);

  useHttpPython<R>({
    t,
    lang,
    send,
    node,
    nodes,
    endpoint,
    identifier,
    isInvisible: props.renderInfo.isInvisible ?? false,
    updateInterval,
    onUseHttpPythonError,
    onUseHttpPythonSuccess,
    beforeRequest: async () => {
      if (userStore.canAlwaysSubmit) {
        setSend(false);
      }
      return beforeRequest?.();
    },
    afterResponse: async () => {
      setSend(false);
      return afterResponse?.();
    },
    getExtraRequestData,
  });

  return (
    <Render id={id} {...props}>
      {children}
      <CFDivider />
      <CFButtonWithBusyTooltip
        busy={send}
        tooltip={translate(Toast_Words["submit-task-busy-message"], lang)}
        onClick={onClick}>
        {buttonText}
      </CFButtonWithBusyTooltip>
    </Render>
  );
}

export default observer(PythonHttpPluginWithSubmit);
