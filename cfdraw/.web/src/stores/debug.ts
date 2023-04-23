import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IDebugStore {
  pollSync: boolean;
  allowAlwaysCommit: boolean;
}
class DebugStore extends ABCStore<IDebugStore> implements IDebugStore {
  pollSync: boolean = false;
  allowAlwaysCommit: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      pollSync: observable,
      allowAlwaysCommit: observable,
    });
  }

  get info(): IDebugStore {
    return this;
  }
}

export const debugStore = new DebugStore();
