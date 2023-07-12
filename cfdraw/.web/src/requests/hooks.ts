import { useCallback, useEffect, useMemo } from "react";

import { Logger, isUndefined } from "@carefree0910/core";

import type {
  IPythonOnSocketMessage,
  IPythonSocketRequest,
  IPythonSocketCallbacks,
} from "@/schema/_python";
import {
  checkSocketHookExists,
  getSocketHooks,
  pushSocketHook,
  runSocketHook,
  socketLog,
} from "@/stores/socket";

/**
 * this function will try to inject a simple but useful retry mechanism, so we only need to
 * focus on the core logics in `onMessage` function.
 */
function useOnSocketMessageWithRetry<R>(
  getMessage: () => Promise<IPythonSocketRequest>,
  onMessage: IPythonOnSocketMessage<R>,
  retryInterval?: number,
): IPythonOnSocketMessage<R> {
  return useCallback(
    (message) => {
      return onMessage(message).then((res) => {
        let { newMessage, newMessageInterval } = res ?? {};
        if (!isUndefined(retryInterval) && message.status === "exception") {
          Logger.warn(
            `socket exception occurred: ${message.message}, ` +
              `will retry after ${retryInterval}ms`,
          );
          newMessage ??= getMessage;
          newMessageInterval ??= retryInterval;
        }
        return { newMessage, newMessageInterval };
      });
    },
    [getMessage, onMessage, retryInterval],
  );
}
export function useWebSocketHook<R>({
  isInvisible,
  hash: _hash,
  getMessage,
  onMessage,
  onSocketError,
  retryInterval,
  updateInterval,
  isInternal,
}: IPythonSocketCallbacks<R> & {
  isInvisible: boolean;
  hash?: string;
  isInternal?: boolean;
}) {
  const hash = useMemo(() => (isInvisible ? undefined : _hash), [isInvisible, _hash]);
  const onMessageWithRetry = useOnSocketMessageWithRetry(getMessage, onMessage, retryInterval);

  useEffect(() => {
    if (isUndefined(hash)) return;
    if (checkSocketHookExists(hash)) return;
    socketLog(`> add hook (${hash})`);
    pushSocketHook({
      key: hash,
      getMessage,
      onMessage: onMessageWithRetry,
      onSocketError,
      updateInterval,
      isInternal,
    }).then(() => {
      socketLog(
        `> current hooks: ${getSocketHooks()
          .map((h) => h.key)
          .join(", ")}`,
      );
      runSocketHook(hash);
    });
  }, [hash, onMessageWithRetry, onSocketError, isInternal]);
}
