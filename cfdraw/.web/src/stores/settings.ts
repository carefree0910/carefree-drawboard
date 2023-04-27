import { makeObservable, observable } from "mobx";

import { ABCStore } from "@carefree0910/business";

export interface ISettingsStore {
  defaultInfoTimeout: number;
}
class SettingsStore extends ABCStore<ISettingsStore> implements ISettingsStore {
  defaultInfoTimeout: number = 500;

  constructor() {
    super();
    makeObservable(this, {
      defaultInfoTimeout: observable,
    });
  }

  get info(): ISettingsStore {
    return this;
  }
}

export const settingsStore = new SettingsStore();
