import { makeObservable, observable } from "mobx";

import type { Dictionary } from "@carefree0910/core";
import { ABCStore, useIsReady } from "@carefree0910/business";

export type IPluginsNeedRender = Dictionary<boolean>;
class PluginsNeedRenderStore extends ABCStore<IPluginsNeedRender> {
  needRender: IPluginsNeedRender = {};

  constructor() {
    super();
    makeObservable(this, {
      needRender: observable,
    });
  }

  get info(): IPluginsNeedRender {
    return this.needRender;
  }
}

const pluginsNeedRenderStore = new PluginsNeedRenderStore();
export const usePluginNeedRender = (id: string) =>
  useIsReady() && (pluginsNeedRenderStore.needRender[id] ?? false);
export const setPluginNeedRender = (id: string, needRender: boolean) =>
  pluginsNeedRenderStore.updateProperty(id, needRender);
