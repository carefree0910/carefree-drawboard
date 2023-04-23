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
  const timeout = pythonStore.globalSettings.timeout ?? 300000;
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

function useOnSocketMessageWithRetry<R>(
  getMessage: () => Promise<IPythonSocketRequest>,
  onMessage: IPythonOnSocketMessage<R>,
): IPythonOnSocketMessage<R> {
  return useCallback(
    (message) => {
      if (message.status === "exception") {
        Logger.warn(`socket exception occurred: ${message.message}`);
        return Promise.resolve({ newMessage: getMessage });
      }
      return onMessage(message);
    },
    [getMessage, onMessage],
  );
}
export function useWebSocketHook<R>({
  isInvisible,
  hash: _hash,
  getMessage,
  onMessage,
  onSocketError,
  dependencies,
  useRetry = true,
  updateInterval,
}: IPythonSocketCallbacks<R> & {
  isInvisible: boolean;
  hash?: string;
  dependencies?: any[];
  useRetry?: boolean;
  updateInterval?: number;
}) {
  const hash = useMemo(() => (isInvisible ? undefined : _hash), [isInvisible, _hash]);
  const onMessageWithRetry = useOnSocketMessageWithRetry(getMessage, onMessage);
  const chosenOnMessage = useRetry ? onMessageWithRetry : onMessage;

  useEffect(() => {
    if (isUndefined(hash)) return;
    socketLog(`> add hook (${hash})`);
    pushSocketHook({
      key: hash,
      getMessage,
      onMessage: chosenOnMessage,
      onSocketError,
      updateInterval,
    });
    socketLog(
      `> current hooks: ${getSocketHooks()
        .map((h) => h.key)
        .join(", ")}`,
    );
    runSocketHook(hash);
  }, [hash, ...(dependencies ?? [])]);
}
