import axios from "axios";
import { useCallback, useEffect } from "react";

import { Logger, isUndefined } from "@carefree0910/core";

import type { APISources, APIs } from "@/schema/requests";
import type {
  IPythonOnSocketMessage,
  IPythonRequest,
  IPythonSocketCallbacks,
} from "@/schema/_python";
import { pythonStore } from "@/stores/_python";
import { useInceptors } from "./interceptors";
import { pushSocketHook, runSocketHook, socketStore } from "@/stores/socket";

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
  getMessage: () => Promise<IPythonRequest>,
  onMessage: IPythonOnSocketMessage<R>,
): IPythonOnSocketMessage<R> {
  return useCallback(
    ({ success, message, data }) => {
      if (data.status === "exception") {
        Logger.warn(`socket exception occurred: ${data.message}`);
        return Promise.resolve({ newMessage: getMessage });
      }
      return onMessage({ success, message, data });
    },
    [getMessage, onMessage],
  );
}
export function useWebSocketHook<R>({
  hash,
  getMessage,
  onMessage,
  onSocketError,
  dependencies,
  useRetry = true,
}: IPythonSocketCallbacks<R> & {
  hash?: string;
  dependencies?: any[];
  useRetry?: boolean;
}) {
  const onMessageWithRetry = useOnSocketMessageWithRetry(getMessage, onMessage);
  const chosenOnMessage = useRetry ? onMessageWithRetry : onMessage;

  useEffect(() => {
    if (isUndefined(hash)) return;
    socketStore.log(`> add hook (${hash})`);
    pushSocketHook({
      key: hash,
      getMessage,
      onMessage: chosenOnMessage,
      onSocketError,
    });
    socketStore.log(`> current hooks: ${socketStore.hooks.map((h) => h.key).join(", ")}`);
    runSocketHook(hash);
  }, [hash, ...(dependencies ?? [])]);
}
