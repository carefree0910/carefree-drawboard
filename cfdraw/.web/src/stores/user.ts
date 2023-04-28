import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

import { debugStore } from "./debug";

export interface IUserStore {
  userId: string;
  canAlwaysSubmit: boolean;
}
class UserStore extends ABCStore<IUserStore> implements IUserStore {
  userId: string = "";
  canAlwaysSubmit: boolean = debugStore.allowAlwaysCommit;

  constructor() {
    super();
    makeObservable(this, {
      userId: observable,
      canAlwaysSubmit: observable,
    });
  }

  get info(): IUserStore {
    return this;
  }
}

export const userStore = new UserStore();
