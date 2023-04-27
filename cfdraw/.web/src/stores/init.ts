import { makeObservable, observable } from "mobx";

import {
  CROP_MANAGER_PLUGIN_NAME,
  FOCUS_PLUGIN_NAME,
  FRAME_EDITOR_PLUGIN_NAME,
  GUIDELINE_PLUGIN_NAME,
  GUIDELINE_SYSTEM_PLUGIN_NAME,
  IBoardOptions,
  MAGNET_PLUGIN_NAME,
  WATERMARK_PLUGIN_NAME,
  allInternalPlugins,
} from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import { themeStore } from "./theme";

export interface IInitStore {
  working: boolean;
  boardOptions?: Partial<IBoardOptions>;
}
class InitStore extends ABCStore<IInitStore> implements IInitStore {
  working: boolean = false;
  boardOptions: Partial<IBoardOptions>;

  constructor() {
    super();
    this.boardOptions = {
      autoResize: true,
      internalPlugins: [GUIDELINE_SYSTEM_PLUGIN_NAME].concat(allInternalPlugins),
      excludedPlugins: new Set([
        CROP_MANAGER_PLUGIN_NAME,
        FRAME_EDITOR_PLUGIN_NAME,
        FOCUS_PLUGIN_NAME,
        WATERMARK_PLUGIN_NAME,
        GUIDELINE_PLUGIN_NAME,
        MAGNET_PLUGIN_NAME,
      ]),
      useGlobalClipboard: false, // TODO : test `true`
      backgroundColor: themeStore.styles.boardBg,
      fitContainerOptions: {
        targetFields: undefined,
      },
      bgMode: false, // TODO : test `true`
    };
    makeObservable(this, {
      working: observable,
      boardOptions: observable,
    });
  }

  get info(): IInitStore {
    return this;
  }
}

export const initStore = new InitStore();
