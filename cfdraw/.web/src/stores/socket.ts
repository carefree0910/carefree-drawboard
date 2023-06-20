import { makeObservable, observable } from "mobx";
import { useEffect } from "react";

import { Bundle, Dictionary, Logger, isUndefined, waitUntil } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type {
  IPythonSocketRequest,
  IPythonSocketMessage,
  IPythonOnSocketMessage,
} from "@/schema/_python";
import { getBaseURL } from "@/utils/misc";
import { settingsStore } from "@/stores/settings";

const DEBUG = false;

interface SocketHook<R> {
  key: string;
  getMessage: () => Promise<IPythonSocketRequest>;
  onMessage: IPythonOnSocketMessage<R>;
  onSocketError?: (err: any) => void;
  updateInterval?: number;
  timer?: any;
  shouldTerminate?: boolean;
  isInternal?: boolean;
}

export interface ISocketStore {
  socket?: WebSocket;
  shouldTerminate: boolean;
  hooks: Bundle<SocketHook<any>>;
}
class SocketStore extends ABCStore<ISocketStore> implements ISocketStore {
  socket?: WebSocket = undefined;
  shouldTerminate: boolean = false;
  hooks = new Bundle<SocketHook<any>>([]);

  constructor() {
    super();
    makeObservable(this, {
      socket: observable,
      shouldTerminate: observable,
      hooks: observable,
    });
  }

  get info(): ISocketStore {
    return this;
  }

  run(key: string) {
    return waitUntil(() => !!socketStore.socket).then(() => {
      const hook = socketStore.hooks.get(key);
      if (!hook) {
        Logger.warn(`hook not found: ${key}`);
        return;
      }
      const hash = hook.key;
      socketLog(`>> send message (${hash})`);

      const send = () => {
        hook
          .getMessage()
          .then((data) => {
            if (data.hash !== hash) {
              Logger.warn("Internal error: hash mismatched.");
              return;
            }
            if (this.shouldTerminate) {
              Logger.warn("Should terminate socket connection in `send`.");
              return;
            }
            socketStore.socket!.send(JSON.stringify(data));
            socketLog(`>>> message sent (${hash})`);
            if (hook.updateInterval && !hook.shouldTerminate) {
              hook.timer = setTimeout(send, hook.updateInterval);
            }
          })
          .catch((e) => {
            hook.onMessage({
              hash,
              status: "interrupted",
              message: e.message,
              total: 0,
              pending: 0,
              data: {},
            });
          });
      };

      hook.shouldTerminate = false;
      send();
    });
  }
}

const socketStore = new SocketStore();
export const socketLog = (...args: any[]) => DEBUG && console.log(...args);
export const getSocketHook = (hash: string) => socketStore.hooks.get(hash);
export const getSocketHooks = () => socketStore.hooks;
export const runSocketHook = (key: string) => socketStore.run(key);
export const pushSocketHook = <R>(hook: SocketHook<R>) => {
  return waitUntil(() => !!socketStore.socket).then(() => {
    // need to wait until socket is ready, to avoid hooks being pushed too early that
    // `runSocketHook` will be executed twice (one at `onopen`, other at `useWebSocketHook`)
    const hooks = socketStore.hooks.clone();
    hooks.push(hook);
    socketStore.updateProperty("hooks", hooks);
  });
};
export const removeSocketHooks = (...hashes: string[]) => {
  const hooks = socketStore.hooks;
  hashes.forEach((hash) => {
    const hook = hooks.remove(hash);
    hook.shouldTerminate = true;
    clearTimeout(hook.timer);
  });
  socketStore.updateProperty("hooks", hooks);
};
export const checkSocketHookExists = (key: string) => {
  return socketStore.hooks.has(key);
};
interface ICaches<R> {
  key: string;
  working: Dictionary<boolean>;
  results: Dictionary<R | undefined>;
}
interface IRunOneTimeSocketHook<R> {
  key: string;
  hook: Omit<SocketHook<R>, "onMessage">;
  timeout?: number;
}
const timers: Dictionary<any> = {};
const caches = new Bundle<ICaches<any>>([]);
const clear = (key: string, hash: string, timeout?: number) => {
  const timerKey = `${key}-${hash}`;
  clearTimeout(timers[timerKey]);
  timers[timerKey] = setTimeout(() => {
    delete timers[timerKey];
    delete caches.get(key)?.results[hash];
  }, timeout ?? 1000);
};
export const runOneTimeSocketHook = async <R>({
  key,
  hook,
  timeout,
}: IRunOneTimeSocketHook<R>): Promise<R | undefined> => {
  let _caches = caches.get(key);
  if (isUndefined(_caches)) {
    _caches = { key, working: {}, results: {} };
    caches.push(_caches);
  }
  const hookKey = hook.key;
  const keyCaches = _caches as ICaches<R>;
  const returnResults = () => {
    clear(key, hookKey, timeout);
    return keyCaches.results[hookKey];
  };
  if (isUndefined(hookKey)) return;
  if (!isUndefined(keyCaches.results[hookKey])) return returnResults();
  if (keyCaches.working[hookKey]) {
    return waitUntil(() => !isUndefined(keyCaches.results[hookKey])).then(returnResults);
  }
  keyCaches.working[hookKey] = true;
  return new Promise((resolve) => {
    const onMessage: IPythonOnSocketMessage<R> = async ({ status, message, data: { final } }) => {
      removeSocketHooks(hookKey);
      delete keyCaches.working[hookKey];
      if (status === "finished" && final) {
        keyCaches.results[hookKey] = final;
        clear(key, hookKey, timeout);
        resolve(final);
      } else if (status === "exception") {
        Logger.warn(`runOneTimeSocketHook (${key}) failed: ${message}`);
        resolve(undefined);
      }
      return {};
    };
    pushSocketHook({ ...hook, onMessage }).then(() => runSocketHook(hookKey));
  });
};

const log = socketLog;
interface IUseWebSocket {
  interval?: number;
}
export function useWebSocket(opt?: IUseWebSocket) {
  const interval = opt?.interval ?? 1000;
  const baseURL = getBaseURL("_python");
  const socketURL = baseURL.replace("http", "ws").replace("https", "wss");
  const socketEndpoint = settingsStore.internalSettings?.socketEndpoint ?? "/ws";

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
        socket.onmessage = ({ data }) => {
          const alive = () => connected && !shouldTerminate;
          if (!alive()) {
            log(">> not alive");
            socket.close();
            return;
          }
          const parsed = JSON.parse(data) as IPythonSocketMessage<any>;
          log(
            `>> incoming message : ${parsed.hash}, current hooks: ${socketStore.hooks
              .map((h) => h.key)
              .join(", ")}`,
          );
          socketStore.hooks.forEach((hook) => {
            if (parsed.hash !== hook.key) return;
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
        // run existing hooks, mainly for hot reload
        socketStore.hooks.forEach(({ key }) => runSocketHook(key));
        // tell the plugin that socket is ready
        socketStore.updateProperty("socket", socket);
      };
      socket.onclose = (e) => {
        connected = false;
        log("> on close");
        if (shouldTerminate) {
          log(">> shouldTerminate");
          Logger.log("Socket connection terminated.");
          return;
        }
        Logger.warn(
          `Socket connection closed (reason: ${e.reason}), ` +
            "cleaning up external hooks and retrying...",
        );
        const externalHooks = socketStore.hooks.filter((h) => !h.isInternal);
        removeSocketHooks(...externalHooks.map((h) => h.key));
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
    socketStore.updateProperty("shouldTerminate", false);
    _connect();

    return () => {
      log("cleanup...");
      shouldTerminate = true;
      socketStore.updateProperty("shouldTerminate", true);
      clearTimeout(timer);
      clearTimeout(newTimer);
      if (connected) socket?.close();
    };
  }, []);
}
