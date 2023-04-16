import { makeObservable, observable } from "mobx";

import { ABCStore } from "@noli/business";

export interface IUIStore {
  disablePluginSettings: boolean;
}
class UIStore extends ABCStore<IUIStore> implements IUIStore {
  disablePluginSettings: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      disablePluginSettings: observable,
    });
  }

  get info(): IUIStore {
    return this;
  }
}

export const uiStore = new UIStore();
