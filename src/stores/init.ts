import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IInitStore {
  working: boolean;
}
class InitStore extends ABCStore<IInitStore> implements IInitStore {
  working: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      working: observable,
    });
  }

  get info(): IInitStore {
    return this;
  }
}

export const initStore = new InitStore();
