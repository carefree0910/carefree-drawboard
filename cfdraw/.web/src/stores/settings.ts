import { makeObservable, observable, runInAction } from "mobx";

import type { Lang } from "@carefree0910/core";
import { ABCStore, langStore } from "@carefree0910/business";

export interface ISettingsStore {
  defaultLang: Lang;
  defaultInfoTimeout: number;
}
class SettingsStore extends ABCStore<ISettingsStore> implements ISettingsStore {
  defaultLang: Lang = "en";
  defaultInfoTimeout: number = 500;

  constructor() {
    super();
    makeObservable(this, {
      defaultLang: observable,
      defaultInfoTimeout: observable,
    });
  }

  get info(): ISettingsStore {
    return this;
  }
}

export const settingsStore = new SettingsStore();
export const updateSettings = (data: Partial<ISettingsStore>) => {
  runInAction(() => {
    if (data.defaultLang) {
      langStore.tgt = data.defaultLang;
    }
    settingsStore.updateProperty(data);
  });
};
