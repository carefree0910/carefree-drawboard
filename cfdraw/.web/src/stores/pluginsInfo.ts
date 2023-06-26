import { useCallback, useEffect } from "react";
import { action, makeObservable, observable, runInAction } from "mobx";

import { Dictionary, getRandomHash, isUndefined, replaceAll } from "@carefree0910/core";
import { ABCStore, useIsReady } from "@carefree0910/business";

import type { IMeta } from "@/schema/meta";
import type { ReactPlugins } from "@/schema/plugins";
import type { IPythonPluginMessage } from "@/schema/_python";
import type { IMetaInjections } from "./meta";
import { allReactPlugins } from "@/schema/plugins";
import { stripHashFromIdentifier } from "@/utils/misc";

interface IDs {
  id: string;
  pureIdentifier: string;
}
interface ITaskCache {
  currentMeta?: IMeta;
  injections?: IMetaInjections;
}
export interface IPluginsInfoStore {
  ids: Dictionary<IDs>;
  hashes: Dictionary<string>;
  messages: Dictionary<IPythonPluginMessage>;
  taskCaches: Dictionary<ITaskCache>;
  visible: Dictionary<boolean>;
  pythonVisible: Dictionary<boolean>;
  expanded: Dictionary<boolean>;
  needRender: Dictionary<boolean>;
  hierarchy: Dictionary<string[]>;
  updaters: Dictionary<(e: any) => Promise<void>>;
  follows: Dictionary<boolean>;
}
type IPluginCollection = keyof IPluginsInfoStore;
type IPluginCollectionValue<T extends IPluginCollection> = IPluginsInfoStore[T][string];
interface ISetPluginDefault<T extends IPluginCollection> {
  key: string;
  hasEffect: boolean;
  getDefault: () => IPluginCollectionValue<T>;
}
class PluginsInfoStore extends ABCStore<IPluginsInfoStore> implements IPluginsInfoStore {
  ids: Dictionary<IDs> = {};
  hashes: Dictionary<string> = {};
  messages: Dictionary<IPythonPluginMessage> = {};
  taskCaches: Dictionary<ITaskCache> = {};
  visible: Dictionary<boolean> = {};
  pythonVisible: Dictionary<boolean> = {};
  expanded: Dictionary<boolean> = {};
  needRender: Dictionary<boolean> = {};
  hierarchy: Dictionary<string[]> = {};
  updaters: Dictionary<(e: any) => Promise<void>> = {};
  follows: Dictionary<boolean> = {};

  constructor() {
    super();
    makeObservable(this, {
      ids: observable,
      hashes: observable,
      messages: observable,
      taskCaches: observable,
      visible: observable,
      pythonVisible: observable,
      expanded: observable,
      needRender: observable,
      hierarchy: observable,
      updaters: observable,
      follows: observable,
      set: action,
      setDefault: action,
      remove: action,
    });
  }

  get info(): IPluginsInfoStore {
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

const pluginsInfoStore = new PluginsInfoStore();
// ids
export function usePluginIds(plugin: ReactPlugins, hasEffect?: boolean): IDs;
export function usePluginIds(identifier: string, hasEffect?: boolean): IDs;
export function usePluginIds(input: ReactPlugins | string, hasEffect: boolean = true): IDs {
  const pureIdentifier = allReactPlugins.includes(input)
    ? input
    : replaceAll(stripHashFromIdentifier(input), ".", "_");
  return pluginsInfoStore.setDefault("ids", {
    key: pureIdentifier,
    hasEffect,
    getDefault: () => ({ id: `${pureIdentifier}_${getRandomHash()}`, pureIdentifier }),
  });
}
// hashes
export const usePluginHash = (id: string): string => {
  return pluginsInfoStore.setDefault("hashes", {
    key: id,
    hasEffect: false,
    getDefault: () => getRandomHash().toString(),
  });
};
// messages
export const usePluginMessage = (id: string): IPluginsInfoStore["messages"][string] | undefined =>
  pluginsInfoStore.messages[id];
export const setPluginMessage = (id: string, message: IPythonPluginMessage) =>
  pluginsInfoStore.set("messages", id, message);
export const removePluginMessage = (id: string) => pluginsInfoStore.remove("messages", id);
// task caches
export const usePluginTaskCache = (id: string): ITaskCache | undefined =>
  pluginsInfoStore.taskCaches[id];
export const setPluginTaskCache = (id: string, cache: ITaskCache) =>
  pluginsInfoStore.set("taskCaches", id, cache);
export const removePluginTaskCache = (id: string) => pluginsInfoStore.remove("taskCaches", id);
// visible
export const useReactPluginIsVisible = (plugin: ReactPlugins) =>
  pluginsInfoStore.visible[plugin] ?? true;
export const setReactPluginVisible = (plugin: ReactPlugins, visible: boolean) =>
  pluginsInfoStore.set("visible", plugin, visible);
export const usePythonPluginIsVisible = (identifier: string) =>
  pluginsInfoStore.pythonVisible[identifier] ?? true;
export const setPythonPluginVisible = (identifier: string, visible: boolean) =>
  pluginsInfoStore.set("pythonVisible", identifier, visible);
// expanded
export const usePluginsExpanded = () => pluginsInfoStore.expanded;
export const usePluginIsExpanded = (id: string) => pluginsInfoStore.expanded[id] ?? false;
export const usePluginGroupIsExpanded = (groupId?: string) =>
  isUndefined(groupId) ? false : usePluginIsExpanded(groupId);
export const setPluginExpanded = (id: string, expand: boolean) => {
  runInAction(() => {
    pluginsInfoStore.expanded[id] = expand;
    // only one plugin can be expanded at the same time
    if (expand) {
      Object.entries(pluginsInfoStore.expanded).forEach(([key, value]) => {
        if (expand && id !== key && value) {
          pluginsInfoStore.expanded[key] = false;
        }
      });
    }
  });
};
// needRender
export const usePluginNeedRender = (id: string) =>
  useIsReady() && (pluginsInfoStore.needRender[id] ?? false);
export const setPluginNeedRender = (id: string, needRender: boolean) =>
  runInAction(() => {
    pluginsInfoStore.needRender[id] = needRender;
    if (!needRender) {
      setPluginExpanded(id, false);
    }
  });
// hierarchy
export const usePluginChildren = (groupId: string) =>
  pluginsInfoStore.setDefault("hierarchy", {
    key: groupId,
    hasEffect: false,
    getDefault: () => [],
  });
export const usePluginParent = (id: string) => {
  const hierarchy = pluginsInfoStore.hierarchy;
  return Object.entries(hierarchy).find(([, children]) => children.includes(id))?.[0];
};
export const addPluginChild = (groupId: string, id: string) => {
  const children = usePluginChildren(groupId);
  if (!children.includes(id)) {
    runInAction(() => children.push(id));
  }
};
// updaters
export const usePluginUpdater = (id: string) => {
  const updater = pluginsInfoStore.updaters[id];
  const children = [...usePluginChildren(id)];
  return useCallback(
    async (e: any) => {
      if (updater) {
        await updater(e);
      }
      for (const child of children) {
        const childUpdater = pluginsInfoStore.updaters[child];
        if (childUpdater) {
          await childUpdater(e);
        }
      }
    },
    [updater, children.sort().join(",")],
  );
};
export const setPluginUpdater = (id: string, updater: (e: any) => Promise<void>) => {
  pluginsInfoStore.set("updaters", id, updater);
};
// follows
export const usePluginIsFollow = (id: string) => pluginsInfoStore.follows[id];
export const setPluginIsFollow = (id: string, follow: boolean) =>
  pluginsInfoStore.set("follows", id, follow);
