import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface IHooksStore {
  dropping: boolean;
}
class HooksStore extends ABCStore<IHooksStore> implements IHooksStore {
  dropping: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      dropping: observable,
    });
  }

  get info(): IHooksStore {
    return this;
  }
}

export const hooksStore = new HooksStore();
export const setDropping = (dropping: boolean) => hooksStore.updateProperty("dropping", dropping);
