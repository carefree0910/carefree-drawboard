import { makeObservable, observable } from "mobx";

import { IBoardOptions, Lang, isUndefined } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { ReactPlugins, PythonPlugins, IMakePlugin } from "@/schema/plugins";
import type { IPythonPluginGroup } from "@/schema/_python";
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
  excludeReactPlugins?: ReactPlugins[];
  iconLoadingPatience?: number;
}
interface IBoardSettings {
  styles?: Record<ThemeType, Partial<ThemeStyles>>;
  boardOptions?: Partial<IBoardOptions>;
  globalSettings?: IGlobalSettings;
  initialProject?: IProject;
}
interface IExtraPlugins {
  logo?: IMakePlugin<"logo">;
}
export interface ISettingsStore {
  pluginSettings: IMakePlugin<PythonPlugins>[];
  internalSettings?: IInternalSettings;
  boardSettings?: IBoardSettings;
  extraPlugins?: IExtraPlugins;
}
class SettingsStore extends ABCStore<ISettingsStore> implements ISettingsStore {
  hash: string = "";
  pluginSettings: IMakePlugin<PythonPlugins>[] = [];
  boardSettings?: IBoardSettings = undefined;
  internalSettings?: IInternalSettings = undefined;
  extraPlugins?: IExtraPlugins = undefined;

  constructor() {
    super();
    makeObservable(this, {
      hash: observable,
      pluginSettings: observable,
      internalSettings: observable,
      boardSettings: observable,
      extraPlugins: observable,
    });
  }

  get info(): ISettingsStore {
    return this;
  }
}

export const settingsStore = new SettingsStore();
export const usePythonPluginSettings = () => settingsStore.pluginSettings;
export const useFlattenedPythonPluginSettings = () => {
  const flatten = (p: IMakePlugin<PythonPlugins>): IMakePlugin<PythonPlugins>[] => {
    if (p.type !== "_python.pluginGroup") return [p];
    const pluginInfo = p.props.pluginInfo as IPythonPluginGroup["pluginInfo"];
    return pluginInfo.plugins.flatMap((p) => flatten(p));
  };
  return settingsStore.pluginSettings.flatMap(flatten);
};
export const useSettingsSynced = () => !isUndefined(settingsStore.boardSettings);
