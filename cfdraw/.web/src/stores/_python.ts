import { makeObservable, observable, runInAction } from "mobx";

import { IBoardOptions, getHash } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { AvailablePythonPlugins, IMakePlugin } from "@/schema/plugins";
import { ThemeType, ThemeStyles, allThemes } from "./theme";
import { initStore } from "./init";
import { ISettingsStore, settingsStore } from "./settings";

interface IGlobalSettings {
  timeout?: number;
  useStrictMode?: boolean;
  socketEndpoint?: string;
}
interface IBoardSettings {
  styles?: Record<ThemeType, Partial<ThemeStyles>>;
  boardOptions?: Partial<IBoardOptions>;
}
export interface IPythonStore {
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[];
  globalSettings?: IGlobalSettings;
  boardSettings?: IBoardSettings;
  miscSettings?: ISettingsStore;
}
class PythonStore extends ABCStore<IPythonStore> implements IPythonStore {
  hash: string = "";
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[] = [];
  globalSettings?: IGlobalSettings;
  boardSettings?: IBoardSettings;
  miscSettings?: ISettingsStore;

  constructor() {
    super();
    makeObservable(this, {
      hash: observable,
      pluginSettings: observable,
      globalSettings: observable,
      boardSettings: observable,
      miscSettings: observable,
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
    // `globalSettings` should only be updated once.
    if (!pythonStore.globalSettings) {
      pythonStore.globalSettings = data.globalSettings;
    }
    // `boardSettings` should only be updated once.
    if (!pythonStore.boardSettings) {
      pythonStore.boardSettings = data.boardSettings;
      //// Update theme styles
      Object.entries(data.boardSettings?.styles ?? {}).forEach(([key, value]) => {
        if (value) {
          allThemes[key as ThemeType] = {
            ...allThemes[key as ThemeType],
            ...value,
          };
        }
      });
      //// Update board options
      initStore.boardOptions = {
        ...initStore.boardOptions,
        ...data.boardSettings?.boardOptions,
      };
    }
    // `miscSettings` should only be updated once.
    if (!pythonStore.miscSettings) {
      pythonStore.miscSettings = data.miscSettings;
      settingsStore.updateProperty(data.miscSettings ?? {});
    }
  });
  return true;
};
