import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";

import { isUndefined } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";
import { CFButtonWithBusyTooltip, CFDivider, toast } from "@carefree0910/components";

import type { IPythonSocketPluginWithSubmit } from "@/schema/_python";
import { Event } from "@/utils/event";
import { CFDraw_Toast_Words } from "@/lang/toast";
import {
  usePluginHash,
  setPluginExpanded,
  usePluginTaskCache,
  setPluginTaskCache,
} from "@/stores/pluginsInfo";
import { useSocketPython } from "@/hooks/usePython";
import { parseIStr } from "@/actions/i18n";
import Render from "../components/Render";
import { checkHasConstraint } from "../utils/renderFilters";
import { useCurrentMeta, useOnMessage } from "./hooks";

export const socketFinishedEvent = new Event<{ id: string }>();
function PythonPluginWithSubmit({
  id,
  pluginInfo,
  buttonText,
  onIntermediate,
  onFinished,
  onSocketError,
  getExtraRequestData,
  getInjections,
  children,
  ...props
}: IPythonSocketPluginWithSubmit) {
  const {
    node,
    nodes,
    identifier,
    retryInterval,
    updateInterval,
    closeOnSubmit = true,
    toastOnSubmit = true,
    toastMessageOnSubmit,
    exportFullImages,
  } = pluginInfo;
  const lang = langStore.tgt;
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const taskCache = usePluginTaskCache(id);
  const hasConstraint = checkHasConstraint(props);
  const currentMeta = hasConstraint ? useCurrentMeta(node, nodes) : undefined;
  const onClick = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setHash(usePluginHash(id));
    if (!taskCache) {
      setPluginTaskCache(id, { currentMeta, injections: getInjections?.() ?? {} });
    }
    if (closeOnSubmit) {
      if (isUndefined(props.groupId)) {
        setPluginExpanded(id, false);
      } else {
        setPluginExpanded(props.groupId, true);
      }
    }
    if (toastOnSubmit) {
      toast(
        "info",
        parseIStr(
          toastMessageOnSubmit ??
            translate(CFDraw_Toast_Words["submit-task-success-message"], lang),
        ),
      );
    }
  }, [
    id,
    lang,
    closeOnSubmit,
    toastOnSubmit,
    toastMessageOnSubmit,
    busy,
    currentMeta,
    getInjections,
  ]);
  const onMessage = useOnMessage({ id, pluginInfo, onIntermediate, onFinished });

  useSocketPython({
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
    needExportNodeData: hasConstraint,
    exportFullImages,
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
        tooltip={CFDraw_Toast_Words["submit-task-busy-message"]}
        onClick={onClick}>
        {buttonText}
      </CFButtonWithBusyTooltip>
    </Render>
  );
}

export default observer(PythonPluginWithSubmit);
