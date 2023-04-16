import { makeObservable, observable } from "mobx";

import type { Dictionary } from "@noli/core";
import { ABCStore } from "@noli/business";

import type { AvailablePlugins } from "@/schema/plugins";

export type IPluginsInvisible = Partial<Record<AvailablePlugins, boolean>>;
class PluginsInvisibleStore extends ABCStore<IPluginsInvisible> {
  invisible: IPluginsInvisible = {};

  constructor() {
    super();
    makeObservable(this, {
      invisible: observable,
    });
  }

  get info(): IPluginsInvisible {
    return this.invisible;
  }
}

export const pluginsInvisibleStore = new PluginsInvisibleStore();
export const pluginIsInvisible = (plugin: AvailablePlugins) =>
  pluginsInvisibleStore.info[plugin] ?? false;
export const setPluginVisible = (plugin: AvailablePlugins, visible: boolean) =>
  pluginsInvisibleStore.updateProperty(plugin, !visible);

export type IPythonPluginsInvisible = Dictionary<boolean>;
class PythonPluginsInvisibleStore extends ABCStore<IPythonPluginsInvisible> {
  invisible: IPythonPluginsInvisible = {};

  constructor() {
    super();
    makeObservable(this, {
      invisible: observable,
    });
  }

  get info(): IPythonPluginsInvisible {
    return this.invisible;
  }
}

export const pythonPluginsInvisibleStore = new PythonPluginsInvisibleStore();
export const pythonPluginIsInvisible = (identifier: string) =>
  pythonPluginsInvisibleStore.info[identifier] ?? false;
export const setPythonPluginVisible = (identifier: string, visible: boolean) =>
  pythonPluginsInvisibleStore.updateProperty(identifier, !visible);
