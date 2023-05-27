import { computed, makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IUserStore {
  userId: string;
}
class UserStore extends ABCStore<IUserStore> implements IUserStore {
  userId: string = "";

  constructor() {
    super();
    makeObservable(this, {
      userId: observable,
      json: computed,
    });
  }

  get info(): IUserStore {
    return this;
  }

  get json(): string {
    return JSON.stringify(this.info);
  }
}

export const userStore = new UserStore();
