import { useState, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@noli/core";
import { langStore, translate } from "@noli/business";

import type { IPythonHttpPluginWithSubmit } from "@/types/_python";
import { Toast_Words } from "@/lang/toast";
import { useHttpPython } from "@/hooks/usePython";
import { CFButton } from "@/components/CFButton";
import { CFDivider } from "@/components/CFDivider";
import Render from "../components/Render";
import { floatingControlEvent } from "../components/Floating";
import { toast } from "@/utils/toast";
import { useToast } from "@chakra-ui/react";

const PythonHttpPluginWithSubmit = ({
  id,
  pluginInfo: {
    node,
    endpoint,
    identifier,
    updateInterval,
    closeOnSubmit = true,
    toastOnSubmit = true,
    submitToastMessage,
  },
  buttonText,
  onUseHttpPythonError,
  onUseHttpPythonSuccess,
  beforeRequest,
  getExtraRequestData,
  children,
  ...props
}: IPythonHttpPluginWithSubmit<any>) => {
  const t = useToast();
  const lang = langStore.tgt;
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

  function onClick() {
    setSend(true);
    if (closeOnSubmit) {
      floatingControlEvent.emit({ id: _id, expand: false });
    }
    if (toastOnSubmit) {
      submitToastMessage ??= translate(Toast_Words["submit-task-success-message"], lang);
      toast(t, "info", submitToastMessage);
    }
  }

  return (
    <Render id={_id} {...props}>
      {children}
      <CFDivider />
      <CFButton onClick={onClick}>{buttonText}</CFButton>
    </Render>
  );
};

export default observer(PythonHttpPluginWithSubmit);
