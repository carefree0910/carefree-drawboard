import axios from "axios";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { Logger } from "@carefree0910/core";

import type { APISources, APIs } from "@/schema/requests";
import type {
  IPythonOnSocketMessage,
  IPythonRequest,
  IPythonSocketCallbacks,
  IPythonSocketMessage,
} from "@/schema/_python";
import { pythonStore } from "@/stores/_python";
import { useInceptors } from "./interceptors";

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

const DEBUG = false;
const log = (...args: any[]) => DEBUG && console.log(...args);
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
export function useWebSocket<R>({
  connectHash,
  getMessage,
  onMessage,
  onSocketError,
  interval,
  dependencies,
  useRetry = true,
}: IPythonSocketCallbacks<R> & {
  connectHash?: number;
  interval?: number;
  dependencies?: any[];
  useRetry?: boolean;
}) {
  interval ??= 1000;
  const baseURL = useAPI("_python").defaults.baseURL!;
  const socketURL = baseURL.replace("http", "ws").replace("https", "wss");
  const socketEndpoint = pythonStore.globalSettings.sockenEndpoint ?? "/ws";

  onMessage = useMemo(
    () => (useRetry ? useOnSocketMessageWithRetry(getMessage, onMessage) : onMessage),
    [getMessage, onMessage, useRetry],
  );

  useEffect(() => {
    function _connect() {
      log("connecting...");
      socket = new WebSocket(`${socketURL}${socketEndpoint}`);
      socket.onopen = () => {
        log("> onopen");
        connected = true;
        if (shouldTerminate) {
          log(">> shouldTerminate");
          socket.close();
          return;
        }
        log("> send message");
        getMessage().then((data) => socket.send(JSON.stringify(data)));
        socket.onmessage = ({ data }) => {
          const alive = () => connected && !shouldTerminate;
          log("> on message");
          if (!alive()) {
            log(">> not alive");
            socket.close();
            return;
          }
          onMessage(JSON.parse(data) as IPythonSocketMessage<R>).then((res) => {
            if (!res) return;
            const { newMessage, newMessageInterval } = res;
            if (newMessage && alive()) {
              log("> on newMessage");
              newTimer = setTimeout(() => {
                if (alive()) {
                  newMessage().then((data) => {
                    if (alive()) {
                      socket.send(JSON.stringify(data));
                    }
                  });
                }
              }, newMessageInterval ?? interval);
            }
          });
        };
      };
      socket.onclose = (e) => {
        connected = false;
        log("> on close");
        if (shouldTerminate) {
          log(">> shouldTerminate");
          Logger.log("Socket connection terminated.");
          return;
        }
        Logger.warn(`Socket connection closed (reason: ${e.reason}), retrying...`);
        timer = setTimeout(_connect, interval);
      };
      socket.onerror = (err) => {
        log("> on error");
        onSocketError?.(err);
        console.error("Socket error: ", err, ", retrying...");
        socket.close();
      };
    }

    let timer: any;
    let newTimer: any;
    let socket: WebSocket;
    let connected = false;
    let shouldTerminate = false;
    if (!!connectHash || connectHash === 0) _connect();

    return () => {
      shouldTerminate = true;
      clearTimeout(timer);
      clearTimeout(newTimer);
      if (connected) socket?.close();
    };
  }, [connectHash, baseURL, socketURL, socketEndpoint, ...(dependencies ?? [])]);
}
