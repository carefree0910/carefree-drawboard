import { makeObservable, observable, runInAction } from "mobx";

import type { Dictionary } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { AvailablePlugins } from "@/schema/plugins";
import { reactPluginSettings } from "@/_settings";
import {
  pluginIsVisible,
  pythonPluginIsVisible,
  setPluginVisible,
  setPythonPluginVisible,
} from "./pluginVisible";
import { usePythonPluginSettings } from "./_python";

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

export class VisibleManager {
  static visibleBackup?: Dictionary<boolean>;
  static pythonVisibleBackup?: Dictionary<boolean>;

  static updateVisibleBackup() {
    this.visibleBackup = {};
    this.pythonVisibleBackup = {};
    for (const { type } of reactPluginSettings) {
      if (type !== "settings") {
        this.visibleBackup[type] = pluginIsVisible(type);
      }
    }
    for (const {
      props: {
        pluginInfo: { identifier },
      },
    } of usePythonPluginSettings()) {
      this.pythonVisibleBackup[identifier] = pythonPluginIsVisible(identifier);
    }
  }

  static restoreVisibleBackup() {
    runInAction(() => {
      if (this.visibleBackup) {
        Object.entries(this.visibleBackup).forEach(([plugin, visible]) => {
          setPluginVisible(plugin as AvailablePlugins, visible);
        });
      }
      if (this.pythonVisibleBackup) {
        Object.entries(this.pythonVisibleBackup).forEach(([identifier, visible]) => {
          setPythonPluginVisible(identifier, visible);
        });
      }
    });
    this.visibleBackup = undefined;
    this.pythonVisibleBackup = undefined;
  }
}
