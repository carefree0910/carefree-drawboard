import { makeObservable, observable } from "mobx";

import { IBoardOptions, Lang } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { AvailablePlugins, AvailablePythonPlugins, IMakePlugin } from "@/schema/plugins";
import type { IProject } from "@/actions/manageProjects";
import { ThemeType, ThemeStyles } from "./theme";

interface IInternalSettings {
  timeout?: number;
  useStrictMode?: boolean;
  socketEndpoint?: string;
}
interface IGlobalSettings {
  defaultLang?: Lang;
  defaultInfoTimeout?: number;
  excludeReactPlugins?: AvailablePlugins[];
}
interface IBoardSettings {
  styles?: Record<ThemeType, Partial<ThemeStyles>>;
  boardOptions?: Partial<IBoardOptions>;
  globalSettings?: IGlobalSettings;
  initialProject?: IProject;
}
export interface ISettingsStore {
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[];
  internalSettings?: IInternalSettings;
  boardSettings?: IBoardSettings;
}
class SettingsStore extends ABCStore<ISettingsStore> implements ISettingsStore {
  hash: string = "";
  pluginSettings: IMakePlugin<AvailablePythonPlugins>[] = [];
  boardSettings?: IBoardSettings;
  internalSettings?: IInternalSettings;

  constructor() {
    super();
    makeObservable(this, {
      hash: observable,
      pluginSettings: observable,
      internalSettings: observable,
      boardSettings: observable,
    });
  }

  get info(): ISettingsStore {
    return this;
  }
}

export const settingsStore = new SettingsStore();
export const usePythonPluginSettings = () => settingsStore.pluginSettings;
export const useSettingsSynced = () => !!settingsStore.boardSettings;
