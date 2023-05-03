import { useCallback } from "react";
import { makeObservable, observable } from "mobx";

import { Dictionary, shallowCopy } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

// maintain the hierarchy of plugins
export type IPluginsHierarchy = Dictionary<string[]>;
class PluginsHierarchyStore extends ABCStore<IPluginsHierarchy> {
  hierarchy: IPluginsHierarchy = {};

  constructor() {
    super();
    makeObservable(this, {
      hierarchy: observable,
    });
  }

  get info(): IPluginsHierarchy {
    return this.hierarchy;
  }
}
const pluginsHierarchyStore = new PluginsHierarchyStore();
export const usePluginChildren = (groupId: string) =>
  pluginsHierarchyStore.hierarchy[groupId] ?? [];
export const addPluginChild = (groupId: string, id: string) => {
  const children = shallowCopy(usePluginChildren(groupId));
  if (!children.includes(id)) {
    children.push(id);
  }
  pluginsHierarchyStore.updateProperty(groupId, children);
};

// store the updaters of plugins. Notice that once the updater is triggered,
// the updaters of the children of the plugin should be triggered as well.
export type IPluginsUpdater = Dictionary<(e: any) => Promise<void>>;
class PluginsUpdaterStore extends ABCStore<IPluginsUpdater> {
  updaters: IPluginsUpdater = {};

  constructor() {
    super();
    makeObservable(this, {
      updaters: observable,
    });
  }

  get info(): IPluginsUpdater {
    return this.updaters;
  }
}
const pluginsUpdaterStore = new PluginsUpdaterStore();
export const usePluginUpdater = (id: string) => {
  const updater = pluginsUpdaterStore.updaters[id];
  const children = usePluginChildren(id);
  return useCallback(
    async (e: any) => {
      if (updater) {
        await updater(e);
      }
      for (const child of children) {
        const childUpdater = pluginsUpdaterStore.updaters[child];
        if (childUpdater) {
          await childUpdater(e);
        }
      }
    },
    [updater, children],
  );
};
export const setPluginUpdater = (id: string, updater: (e: any) => Promise<void>) => {
  pluginsUpdaterStore.updateProperty(id, updater);
};
