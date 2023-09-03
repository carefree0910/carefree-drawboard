import { isUndefined } from "@carefree0910/core";
import { toastWord } from "@carefree0910/components";

import type { OnPythonPluginMessage, IPythonPlugin, IPythonPluginMessage } from "@/schema/_python";
import { CFDraw_Toast_Words } from "@/lang/toast";
import { getSocketHook, removeSocketHooks, socketLog } from "@/stores/socket";
import { removePluginMessage, removePluginTaskCache } from "@/stores/pluginsInfo";
import { socketFinishedEvent } from "../_python/PluginWithSubmit";

function cleanup(id: string, hash: string): void {
  socketFinishedEvent.emit({ id });
  removePluginMessage(id);
  removePluginTaskCache(id);
  socketLog(`> remove hook (${hash})`);
  removeSocketHooks(hash);
}

interface ICleanupFinished {
  id: string;
  message: IPythonPluginMessage;
  onFinished: OnPythonPluginMessage;
}
export function cleanupFinished({ id, message, onFinished }: ICleanupFinished): void {
  const { hash } = message;
  onFinished(message);
  // cleanup if plugin need not update periodically
  if (isUndefined(getSocketHook(hash)?.updateInterval)) {
    cleanup(id, hash);
  }
}

interface ICleanupException {
  id: string;
  message: IPythonPluginMessage;
  pluginInfo: IPythonPlugin["pluginInfo"];
}
export function cleanupException({
  id,
  message: { hash, message },
  pluginInfo: { noErrorToast, retryInterval },
}: ICleanupException): void {
  if (!noErrorToast) {
    toastWord("error", CFDraw_Toast_Words["submit-task-error-message"], {
      appendix: ` - ${message}`,
    });
  }
  // cleanup if retry is not specified
  if (isUndefined(retryInterval)) {
    cleanup(id, hash);
  }
}

interface ICleanupInterrupted {
  id: string;
  message: IPythonPluginMessage;
}
export function cleanupInterrupted({ id, message: { hash, message } }: ICleanupInterrupted): void {
  toastWord("warning", CFDraw_Toast_Words["submit-task-interrupted-message"], {
    appendix: ` - ${message}`,
  });
  cleanup(id, hash);
}
