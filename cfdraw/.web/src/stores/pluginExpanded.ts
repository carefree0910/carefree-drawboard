import { makeObservable, observable, runInAction } from "mobx";

import { Dictionary, isUndefined } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

export type IPluginsExpanded = Dictionary<boolean>;
class PluginsExpandedStore extends ABCStore<IPluginsExpanded> {
  expanded: IPluginsExpanded = {};

  constructor() {
    super();
    makeObservable(this, {
      expanded: observable,
    });
  }

  get info(): IPluginsExpanded {
    return this.expanded;
  }
}

const pluginsExpandedStore = new PluginsExpandedStore();
export const usePluginsExpanded = () => pluginsExpandedStore.expanded;
export const usePluginIsExpanded = (id: string) => pluginsExpandedStore.expanded[id] ?? false;
export const usePluginGroupIsExpanded = (groupId?: string) =>
  isUndefined(groupId) ? false : usePluginIsExpanded(groupId);
export const setPluginExpanded = (id: string, expand: boolean) => {
  runInAction(() => {
    pluginsExpandedStore.expanded[id] = expand;
    // only one plugin can be expanded at the same time
    if (expand) {
      Object.entries(pluginsExpandedStore.expanded).forEach(([key, value]) => {
        if (expand && id !== key && value) {
          pluginsExpandedStore.expanded[key] = false;
        }
      });
    }
  });
};
