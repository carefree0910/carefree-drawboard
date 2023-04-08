import { makeObservable, observable } from "mobx";

import { ABCStore } from "@noli/business";

import type { AvailablePluginsAndPythonPlugins } from "@/types/plugins";

export type IPluginsInvisible = Partial<Record<AvailablePluginsAndPythonPlugins, boolean>>;
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
export const isInvisible = (plugin: AvailablePluginsAndPythonPlugins) =>
  pluginsInvisibleStore.info[plugin] ?? false;
export const setVisible = (plugin: AvailablePluginsAndPythonPlugins, visible: boolean) =>
  pluginsInvisibleStore.updateProperty(plugin, !visible);
