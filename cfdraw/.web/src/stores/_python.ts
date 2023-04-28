import { makeObservable, observable, runInAction } from "mobx";

import {
  FOCUS_PLUGIN_NAME,
  GUIDELINE_SYSTEM_PLUGIN_NAME,
  IBoardOptions,
  Lang,
  WATERMARK_PLUGIN_NAME,
  allInternalPlugins,
  getHash,
} from "@carefree0910/core";
import { ABCStore, langStore } from "@carefree0910/business";

import type { AvailablePythonPlugins, IMakePlugin } from "@/schema/plugins";
import { ThemeType, ThemeStyles, allThemes, themeStore } from "./theme";

interface IGlobalSettings {
  timeout?: number;
  useStrictMode?: boolean;
  socketEndpoint?: string;
}
interface IMiscSettings {
  defaultLang: Lang;
  defaultInfoTimeout: number;
}
interface IBoardSettings {
  styles?: Record<ThemeType, Partial<ThemeStyles>>;
  boardOptions?: Partial<IBoardOptions>;
  miscSettings?: Partial<IMiscSettings>;
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
      if (!data.boardSettings) return;
      //// Update theme styles
      Object.entries(data.boardSettings.styles ?? {}).forEach(([key, value]) => {
        if (value) {
          allThemes[key as ThemeType] = {
            ...allThemes[key as ThemeType],
            ...value,
          };
        }
      });
      //// Update board options, notice that this should always come after 'Update
      //// theme styles', because it uses `themeStore.styles.boardBg`.
      data.boardSettings.boardOptions = {
        autoResize: true,
        internalPlugins: [GUIDELINE_SYSTEM_PLUGIN_NAME].concat(allInternalPlugins),
        excludedPlugins: new Set([FOCUS_PLUGIN_NAME, WATERMARK_PLUGIN_NAME]),
        useGlobalClipboard: false, // TODO : test `true`
        backgroundColor: themeStore.styles.boardBg,
        fitContainerOptions: {
          targetFields: undefined,
        },
        bgMode: false, // TODO : test `true`
        ...data.boardSettings.boardOptions,
      };
      //// Update misc settings
      const miscSettings = data.boardSettings.miscSettings ?? {};
      if (miscSettings.defaultLang) {
        langStore.tgt = miscSettings.defaultLang;
      }
      miscSettings.defaultInfoTimeout ??= 300;
      data.boardSettings.miscSettings = miscSettings;
      //// setup property. Once `boardSettings` is set, drawboard will start rendering.
      pythonStore.boardSettings = data.boardSettings;
    }
  });
  return true;
};
