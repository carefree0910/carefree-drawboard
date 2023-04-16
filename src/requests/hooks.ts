import axios from "axios";
import { useEffect } from "react";

import { Logger } from "@noli/core";

import type { APISources, APIs } from "@/schema/requests";
import type { ISocketCallbacks, IPythonSocketMessage } from "@/schema/_python";
import { pythonStore } from "@/stores/_python";
import { useInceptors } from "./interceptors";

// cannot use `useMemo` here
export function useAPI<T extends APISources>(source: T): APIs[T] {
  const timeout = pythonStore.globalSettings.timeout ?? 300000;
  const backendPort = import.meta.env.VITE_CFDRAW_BE_PORT ?? 8123;
  const apis = {
    _python: axios.create({ baseURL: `http://localhost:${backendPort}`, timeout }),
  };
  useInceptors(apis);
  return apis[source];
}

const DEBUG = false;
const log = (...args: any[]) => DEBUG && console.log(...args);
export function useWebSocket<R>({
  getMessage,
  onMessage,
  onError,
  interval,
  dependencies,
}: ISocketCallbacks<R> & {
  interval?: number;
  dependencies?: any[];
}) {
  interval ??= 1000;
  const baseURL = useAPI("_python").defaults.baseURL!;
  const socketURL = baseURL.replace("http", "ws").replace("https", "wss");
  const socketEndpoint = pythonStore.globalSettings.sockenEndpoint ?? "/ws";

  useEffect(() => {
    function connect() {
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
        socket.send(JSON.stringify(getMessage()));
        socket.onmessage = ({ data }) => {
          log("> on message");
          if (shouldTerminate) {
            log(">> shouldTerminate");
            socket.close();
            return;
          }
          onMessage(JSON.parse(data) as IPythonSocketMessage<R>).then((res) => {
            if (!res) return;
            const { newMessage, interval: newInterval } = res;
            if (newMessage && !shouldTerminate) {
              log("> on newMessage");
              newTimer = setTimeout(() => {
                if (connected && !shouldTerminate) {
                  socket.send(JSON.stringify(newMessage()));
                }
              }, newInterval ?? interval);
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
        timer = setTimeout(connect, interval);
      };
      socket.onerror = (err) => {
        log("> on error");
        onError?.(err);
        console.error("Socket error: ", err, ", retrying...");
        socket.close();
      };
    }

    let timer: any;
    let newTimer: any;
    let socket: WebSocket;
    let connected = false;
    let shouldTerminate = false;
    connect();

    return () => {
      shouldTerminate = true;
      clearTimeout(timer);
      clearTimeout(newTimer);
      if (connected) socket?.close();
    };
  }, [baseURL, socketURL, socketEndpoint, ...(dependencies ?? [])]);
}
