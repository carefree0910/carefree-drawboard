import { makeObservable, observable, runInAction } from "mobx";

import { getHash } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { AvailablePythonPlugins, IMakePlugin } from "@/schema/plugins";

interface IGlobalSettings {
  timeout?: number;
  useStrictMode?: boolean;
  socketEndpoint?: string;
}
export interface IPythonStore {
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[];
  globalSettings: IGlobalSettings;
}
class PythonStore extends ABCStore<IPythonStore> implements IPythonStore {
  hash: string = "";
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[] = [];
  globalSettings: IGlobalSettings = {};

  constructor() {
    super();
    makeObservable(this, {
      hash: observable,
      pluginSettings: observable,
      globalSettings: observable,
    });
  }

  get info(): IPythonStore {
    return this;
  }
}

export const pythonStore = new PythonStore();
export const usePythonPluginSettings = () => pythonStore.pluginSettings;
export const updatePythonStore = (data: IPythonStore): boolean => {
  const incomingHash = getHash(JSON.stringify(data)).toString();
  if (pythonStore.hash === incomingHash) return false;
  runInAction(() => {
    pythonStore.hash = incomingHash;
    pythonStore.pluginSettings = data.pluginSettings;
    pythonStore.globalSettings = data.globalSettings;
  });
  return true;
};
