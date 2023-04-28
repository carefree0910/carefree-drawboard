import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IDebugStore {
  pollSync: boolean;
  allowAlwaysCommit: boolean;
  postPseduoUserId: boolean;
  pseduoWaitingTime: number;
}
class DebugStore extends ABCStore<IDebugStore> implements IDebugStore {
  pollSync: boolean = false;
  allowAlwaysCommit: boolean = false;
  postPseduoUserId: boolean = true;
  pseduoWaitingTime: number = 0;

  constructor() {
    super();
    makeObservable(this, {
      pollSync: observable,
      allowAlwaysCommit: observable,
      postPseduoUserId: observable,
      pseduoWaitingTime: observable,
    });
  }

  get info(): IDebugStore {
    return this;
  }
}

export const debugStore = new DebugStore();
