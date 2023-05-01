import type { Dictionary } from "@carefree0910/core";

export interface Listener<T> {
  (event: T): any;
}

export interface Disposable {
  dispose: () => void;
}

export class Event<T> {
  private listeners: Listener<T>[] = [];
  private listenersOncer: Listener<T>[] = [];

  on = (listener: Listener<T>): Disposable => {
    this.listeners.push(listener);
    return {
      dispose: () => this.off(listener),
    };
  };

  once = (listener: Listener<T>): void => {
    this.listenersOncer.push(listener);
  };

  off = (listener: Listener<T>) => {
    var callbackIndex = this.listeners.indexOf(listener);
    if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
  };

  emit = (event: T) => {
    this.listeners.forEach((listener) => listener(event));
    if (this.listenersOncer.length > 0) {
      const toCall = this.listenersOncer;
      this.listenersOncer = [];
      toCall.forEach((listener) => listener(event));
    }
  };
}

type GlobalEventType = "newProject";
interface GlobalEventData {
  newProject: undefined;
}
export interface IGlobalEvent<T extends GlobalEventType = GlobalEventType> {
  type: T;
  data: GlobalEventData[T];
}
export const globalEvent = new Event<IGlobalEvent>();
