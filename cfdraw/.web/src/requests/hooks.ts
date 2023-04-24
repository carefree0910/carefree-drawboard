import axios from "axios";
import { useCallback, useEffect, useMemo } from "react";

import { Logger, isUndefined } from "@carefree0910/core";

import type { APISources, APIs } from "@/schema/requests";
import type {
  IPythonOnSocketMessage,
  IPythonSocketRequest,
  IPythonSocketCallbacks,
} from "@/schema/_python";
import { pythonStore } from "@/stores/_python";
import { useInceptors } from "./interceptors";
import { getSocketHooks, pushSocketHook, runSocketHook, socketLog } from "@/stores/socket";

// cannot use `useMemo` here
export function useAPI<T extends APISources>(source: T): APIs[T] {
  const timeout = pythonStore.globalSettings?.timeout ?? 300000;
  let baseURL = import.meta.env.VITE_CFDRAW_API_URL;
  if (!baseURL) {
    let backendPort = import.meta.env.VITE_CFDRAW_BE_PORT;
    if (!backendPort) {
      backendPort = 8123;
    }
    baseURL = `http://localhost:${backendPort}`;
  }
  const apis = {
    _python: axios.create({ baseURL, timeout }),
  };
  useInceptors(apis);
  return apis[source];
}

/**
 * this function will integrate a simple but useful retry mechanism, so we only need to
 * focus on the core logics in `onMessage` function.
 */
function useOnSocketMessageWithRetry<R>(
  getMessage: () => Promise<IPythonSocketRequest>,
  onMessage: IPythonOnSocketMessage<R>,
  retryInterval?: number,
): IPythonOnSocketMessage<R> {
  return useCallback(
    (message) => {
      if (!isUndefined(retryInterval) && message.status === "exception") {
        Logger.warn(`socket exception occurred: ${message.message}`);
        return Promise.resolve({ newMessage: getMessage, newMessageInterval: retryInterval });
      }
      return onMessage(message);
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
  dependencies,
  retryInterval,
  updateInterval,
  isInternal,
}: IPythonSocketCallbacks<R> & {
  isInvisible: boolean;
  hash?: string;
  dependencies?: any[];
  isInternal?: boolean;
}) {
  const hash = useMemo(() => (isInvisible ? undefined : _hash), [isInvisible, _hash]);
  const onMessageWithRetry = useOnSocketMessageWithRetry(getMessage, onMessage, retryInterval);

  useEffect(() => {
    if (isUndefined(hash)) return;
    socketLog(`> add hook (${hash})`);
    pushSocketHook({
      key: hash,
      getMessage,
      onMessage: onMessageWithRetry,
      onSocketError,
      updateInterval,
      isInternal,
    });
    socketLog(
      `> current hooks: ${getSocketHooks()
        .map((h) => h.key)
        .join(", ")}`,
    );
    runSocketHook(hash);
  }, [hash, onMessageWithRetry, onSocketError, isInternal, ...(dependencies ?? [])]);
}
