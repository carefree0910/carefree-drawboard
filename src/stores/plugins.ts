import { makeObservable, observable } from "mobx";

import { ABCStore } from "@noli/business";

import type { AvailablePlugins } from "@/types/plugins";

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
export const isInvisible = (plugin: AvailablePlugins) =>
  pluginsInvisibleStore.info[plugin] ?? false;
export const setVisible = (plugin: AvailablePlugins, visible: boolean) =>
  pluginsInvisibleStore.updateProperty(plugin, !visible);
