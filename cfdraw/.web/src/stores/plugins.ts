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
  const pureIdentifier = stripHashFromIdentifier(identifier).replaceAll(".", "_");
  if (!pluginsStore.ids[pureIdentifier]) {
    const ids = shallowCopy(pluginsStore.ids);
    ids[pureIdentifier] = { id: `${pureIdentifier}_${getRandomHash()}`, pureIdentifier };
    pluginsStore.updateProperty("ids", ids);
  }
  return pluginsStore.ids[pureIdentifier];
};
