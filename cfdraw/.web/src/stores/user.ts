import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IUserStore {
  canAlwaysSubmit: boolean;
}
class UserStore extends ABCStore<IUserStore> implements IUserStore {
  canAlwaysSubmit: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      canAlwaysSubmit: observable,
    });
  }

  get info(): IUserStore {
    return this;
  }
}

export const userStore = new UserStore();
