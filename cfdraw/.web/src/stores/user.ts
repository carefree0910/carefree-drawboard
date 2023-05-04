import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

import { debugStore } from "./debug";

export interface IUserStore {
  userId: string;
}
class UserStore extends ABCStore<IUserStore> implements IUserStore {
  userId: string = "";

  constructor() {
    super();
    makeObservable(this, {
      userId: observable,
    });
  }

  get info(): IUserStore {
    return this;
  }
}

export const userStore = new UserStore();
