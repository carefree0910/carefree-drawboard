import { makeObservable, observable, runInAction } from "mobx";

import { IBoardOptions, getHash } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { AvailablePythonPlugins, IMakePlugin } from "@/schema/plugins";
import { ThemeType, ThemeStyles, allThemes } from "./theme";
import { getDefaultBoardOptions, initStore } from "./init";
import { ISettingsStore, settingsStore } from "./settings";

interface IGlobalSettings {
  timeout?: number;
  useStrictMode?: boolean;
  socketEndpoint?: string;
}
interface IBoardSettings {
  styles?: Record<ThemeType, Partial<ThemeStyles>>;
  boardOptions?: Partial<IBoardOptions>;
  miscSettings?: ISettingsStore;
}
export interface IPythonStore {
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[];
  globalSettings?: IGlobalSettings;
  boardSettings?: IBoardSettings;
}
class PythonStore extends ABCStore<IPythonStore> implements IPythonStore {
  hash: string = "";
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[] = [];
  globalSettings?: IGlobalSettings;
  boardSettings?: IBoardSettings;

  constructor() {
    super();
    makeObservable(this, {
      hash: observable,
      pluginSettings: observable,
      globalSettings: observable,
      boardSettings: observable,
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
      //// Update theme styles
      Object.entries(data.boardSettings?.styles ?? {}).forEach(([key, value]) => {
        if (value) {
          allThemes[key as ThemeType] = {
            ...allThemes[key as ThemeType],
            ...value,
          };
        }
      });
      //// Update board options, notice that this should always come after 'Update
      //// theme styles', because `getDefaultBoardOptions` depends on theme styles.
      initStore.boardOptions = {
        ...getDefaultBoardOptions(),
        ...data.boardSettings?.boardOptions,
      };
      //// Update misc settings
      if (data.boardSettings?.miscSettings) {
        settingsStore.updateProperty(data.boardSettings.miscSettings);
      }
      //// setup property
      pythonStore.boardSettings = data.boardSettings;
    }
  });
  return true;
};
