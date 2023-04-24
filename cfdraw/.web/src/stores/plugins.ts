import { makeObservable, observable } from "mobx";

import { Dictionary, getRandomHash, shallowCopy } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import { stripHashFromIdentifier } from "@/utils/misc";

interface IDs {
  id: string;
  pureIdentifier: string;
}
export interface IPluginsStore {
  ids: Dictionary<IDs>;
}
class PluginsStore extends ABCStore<IPluginsStore> implements IPluginsStore {
  ids: Dictionary<IDs> = {};

  constructor() {
    super();
    makeObservable(this, {
      ids: observable,
    });
  }

  get info(): IPluginsStore {
    return this;
  }
}

const pluginsStore = new PluginsStore();
export const getPluginIds = (identifier: string): IDs => {
  if (!pluginsStore.ids[identifier]) {
    const ids = shallowCopy(pluginsStore.ids);
    const pureIdentifier = stripHashFromIdentifier(identifier).replaceAll(".", "_");
    ids[identifier] = { id: `${pureIdentifier}_${getRandomHash()}`, pureIdentifier };
    pluginsStore.updateProperty("ids", ids);
  }
  return pluginsStore.ids[identifier];
};
