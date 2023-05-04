import { useCallback, useEffect } from "react";
import { action, makeObservable, observable, runInAction } from "mobx";

import { Dictionary, getRandomHash, isUndefined } from "@carefree0910/core";
import { ABCStore, useIsReady } from "@carefree0910/business";

import type { IPythonResults } from "@/schema/meta";
import type { AvailablePlugins } from "@/schema/plugins";
import type { IPythonSocketMessage } from "@/schema/_python";
import { stripHashFromIdentifier } from "@/utils/misc";

interface IDs {
  id: string;
  pureIdentifier: string;
}
export interface IPluginsStore {
  ids: Dictionary<IDs>;
  hashes: Dictionary<string>;
  messages: Dictionary<IPythonSocketMessage<IPythonResults>>;
  visible: Dictionary<boolean>;
  pythonVisible: Dictionary<boolean>;
  expanded: Dictionary<boolean>;
  needRender: Dictionary<boolean>;
  hierarchy: Dictionary<string[]>;
  updaters: Dictionary<(e: any) => Promise<void>>;
}
type IPluginCollection = keyof IPluginsStore;
type IPluginCollectionValue<T extends IPluginCollection> = IPluginsStore[T][string];
interface ISetPluginDefault<T extends IPluginCollection> {
  key: string;
  hasEffect: boolean;
  getDefault: () => IPluginCollectionValue<T>;
}
class PluginsStore extends ABCStore<IPluginsStore> implements IPluginsStore {
  ids: Dictionary<IDs> = {};
  hashes: Dictionary<string> = {};
  messages: Dictionary<IPythonSocketMessage<IPythonResults>> = {};
  visible: Dictionary<boolean> = {};
  pythonVisible: Dictionary<boolean> = {};
  expanded: Dictionary<boolean> = {};
  needRender: Dictionary<boolean> = {};
  hierarchy: Dictionary<string[]> = {};
  updaters: Dictionary<(e: any) => Promise<void>> = {};

  constructor() {
    super();
    makeObservable(this, {
      ids: observable,
      hashes: observable,
      messages: observable,
      visible: observable,
      pythonVisible: observable,
      expanded: observable,
      needRender: observable,
      hierarchy: observable,
      updaters: observable,
      set: action,
      setDefault: action,
      remove: action,
    });
  }

  get info(): IPluginsStore {
    return this;
  }

  set<T extends IPluginCollection>(collection: T, key: string, value: IPluginCollectionValue<T>) {
    this[collection][key] = value;
  }
  setDefault<T extends IPluginCollection>(
    collection: T,
    { key, hasEffect, getDefault }: ISetPluginDefault<T>,
  ): IPluginCollectionValue<T> {
    let value = this[collection][key];
    let needUpdate = false;
    if (isUndefined(value)) {
      value = getDefault();
      needUpdate = true;
      if (!hasEffect) {
        this[collection][key] = getDefault();
      }
    }
    // this looks dangerous, but since the `hasEffect` should never
    // change during the lifetime of the app, it's safe to do so
    if (hasEffect) {
      useEffect(() => {
        if (needUpdate) {
          runInAction(() => (this[collection][key] = value));
        }
      });
    }
    return value as IPluginCollectionValue<T>;
  }
  remove<T extends IPluginCollection>(collection: T, key: string) {
    delete this[collection][key];
  }
}

const pluginsStore = new PluginsStore();
// ids
export const usePluginIds = (identifier: string): IDs => {
  const pureIdentifier = stripHashFromIdentifier(identifier).replaceAll(".", "_");
  return pluginsStore.setDefault("ids", {
    key: pureIdentifier,
    hasEffect: true,
    getDefault: () => ({ id: `${pureIdentifier}_${getRandomHash()}`, pureIdentifier }),
  });
};
// hashes
export const usePluginHash = (id: string): string => {
  return pluginsStore.setDefault("hashes", {
    key: id,
    hasEffect: false,
    getDefault: () => getRandomHash().toString(),
  });
};
// messages
export const usePluginMessage = (id: string): IPluginsStore["messages"][string] | undefined =>
  pluginsStore.messages[id];
export const setPluginMessage = (id: string, message: IPythonSocketMessage<IPythonResults>) =>
  pluginsStore.set("messages", id, message);
export const removePluginMessage = (id: string) => pluginsStore.remove("messages", id);
export const removePluginMessageFromHash = (hash: string) => {
  const id = Object.keys(pluginsStore.messages).find((id) => pluginsStore.hashes[id] === hash);
  if (!id) return;
  removePluginMessage(id);
};
// visible
export const usePluginIsVisible = (plugin: AvailablePlugins) =>
  pluginsStore.visible[plugin] ?? true;
export const setPluginVisible = (plugin: AvailablePlugins, visible: boolean) =>
  pluginsStore.set("visible", plugin, visible);
export const usePythonPluginIsVisible = (identifier: string) =>
  pluginsStore.pythonVisible[identifier] ?? true;
export const setPythonPluginVisible = (identifier: string, visible: boolean) =>
  pluginsStore.set("pythonVisible", identifier, visible);
// expanded
export const usePluginsExpanded = () => pluginsStore.expanded;
export const usePluginIsExpanded = (id: string) => pluginsStore.expanded[id] ?? false;
export const usePluginGroupIsExpanded = (groupId?: string) =>
  isUndefined(groupId) ? false : usePluginIsExpanded(groupId);
export const setPluginExpanded = (id: string, expand: boolean) => {
  runInAction(() => {
    pluginsStore.expanded[id] = expand;
    // only one plugin can be expanded at the same time
    if (expand) {
      Object.entries(pluginsStore.expanded).forEach(([key, value]) => {
        if (expand && id !== key && value) {
          pluginsStore.expanded[key] = false;
        }
      });
    }
  });
};
// needRender
export const usePluginNeedRender = (id: string) =>
  useIsReady() && (pluginsStore.needRender[id] ?? false);
export const setPluginNeedRender = (id: string, needRender: boolean) =>
  runInAction(() => {
    pluginsStore.needRender[id] = needRender;
    if (!needRender) {
      setPluginExpanded(id, false);
    }
  });
// hierarchy
export const usePluginChildren = (groupId: string) => pluginsStore.hierarchy[groupId] ?? [];
export const addPluginChild = (groupId: string, id: string) => {
  const children = usePluginChildren(groupId);
  if (!children.includes(id)) {
    runInAction(() => children.push(id));
  }
};
// updaters
export const usePluginUpdater = (id: string) => {
  const updater = pluginsStore.updaters[id];
  const children = [...usePluginChildren(id)];
  return useCallback(
    async (e: any) => {
      if (updater) {
        await updater(e);
      }
      for (const child of children) {
        const childUpdater = pluginsStore.updaters[child];
        if (childUpdater) {
          await childUpdater(e);
        }
      }
    },
    [updater, children.sort().join(",")],
  );
};
export const setPluginUpdater = (id: string, updater: (e: any) => Promise<void>) => {
  pluginsStore.set("updaters", id, updater);
};
