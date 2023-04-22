import { makeObservable, observable } from "mobx";
import { useEffect } from "react";

import { Bundle, IWithKey, Logger } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { IPythonOnSocketMessage, IPythonSocketMessage } from "@/schema/_python";
import { pythonStore } from "@/stores/_python";
import { useAPI } from "@/requests/hooks";

const DEBUG = false;

interface SocketHook<R> {
  key: string;
  onMessage: IPythonOnSocketMessage<R>;
  onSocketError?: (err: any) => void;
}

export interface ISocketStore {
  socket?: WebSocket;
  hooks: Bundle<SocketHook<any>>;
}
class SocketStore extends ABCStore<ISocketStore> implements ISocketStore {
  socket?: WebSocket;
  hooks = new Bundle<SocketHook<any>>([]);

  constructor() {
    super();
    makeObservable(this, {
      socket: observable,
      hooks: observable,
    });
  }

  get info(): ISocketStore {
    return this;
  }

  log = (...args: any[]) => DEBUG && console.log(...args);
}

export const socketStore = new SocketStore();
export const pushSocketHook = <R>(hook: SocketHook<R>) => {
  const hooks = socketStore.hooks.clone();
  hooks.push(hook);
  socketStore.updateProperty("hooks", hooks);
};
export const removeSocketHook = (hash: string) => {
  const hooks = socketStore.hooks.clone();
  hooks.remove(hash);
  socketStore.updateProperty("hooks", hooks);
};

const log = socketStore.log;
interface IUseWebSocket {
  interval?: number;
}
export function useWebSocket(opt?: IUseWebSocket) {
  const interval = opt?.interval ?? 1000;
  const baseURL = useAPI("_python").defaults.baseURL!;
  const socketURL = baseURL.replace("http", "ws").replace("https", "wss");
  const socketEndpoint = pythonStore.globalSettings.sockenEndpoint ?? "/ws";

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
        socketStore.updateProperty("socket", socket);
        socket.onmessage = ({ data }) => {
          const alive = () => connected && !shouldTerminate;
          if (!alive()) {
            log(">> not alive");
            socket.close();
            return;
          }
          const parsed = JSON.parse(data) as IPythonSocketMessage<any>;
          log(
            `>> incoming message : ${parsed.data.hash}, current hooks: ${socketStore.hooks
              .map((h) => h.key)
              .join(", ")}`,
          );
          socketStore.hooks.forEach((hook) => {
            if (parsed.data.hash !== hook.key) return;
            log(`>>> onMessage (${hook.key})`);
            hook.onMessage(parsed).then((res) => {
              if (!res) return;
              const { newMessage, newMessageInterval } = res;
              if (newMessage && alive()) {
                log(`>>>> on newMessage (${hook.key})`);
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
        socketStore.hooks.forEach((hook) => hook.onSocketError?.(err));
        console.error("Socket error: ", err, ", retrying...");
        socket.close();
      };
    }

    let timer: any;
    let newTimer: any;
    let socket: WebSocket;
    let connected = false;
    let shouldTerminate = false;
    _connect();

    return () => {
      log("cleanup...");
      shouldTerminate = true;
      clearTimeout(timer);
      clearTimeout(newTimer);
      if (connected) socket?.close();
    };
  }, []);
}
