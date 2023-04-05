import { useEffect } from "react";
import {
  FOCUS_PLUGIN_NAME,
  WATERMARK_PLUGIN_NAME,
  FRAME_EDITOR_PLUGIN_NAME,
  CROP_MANAGER_PLUGIN_NAME,
  MAGNET_PLUGIN_NAME,
  GUIDELINE_PLUGIN_NAME,
  GUIDELINE_SYSTEM_PLUGIN_NAME,
  Graph,
  Logger,
  Matrix2DFields,
  allInternalPlugins,
} from "@noli/core";
import { SVGUnitTest } from "@noli/svg";
import { NoliNativeBoard } from "@noli/native";
import { BoardStore, BoardStoresOptions, useFlags, useBoardStore } from "@noli/business";

import { BOARD_CONTAINER_ID, ENV } from "@/utils/constants";
import { themeStore } from "@/stores/theme";

export function useInitBoard(): void {
  async function _initialize(): Promise<void> {
    // pre settings
    Logger.isDebug = true;

    // check cache
    const cache: { graph?: Graph; globalTransform?: Matrix2DFields } = {};

    // initialize board
    // TODO: make this more elegant

    //// setup unittest to help initialization
    const unittest = new SVGUnitTest(NoliNativeBoard, BOARD_CONTAINER_ID, {
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
      useGlobalClipboard: false,
      backgroundColor: themeStore.styles.boardBg,
      fitContainerOptions: {
        targetFields: cache?.globalTransform,
      },
      bgMode: false,
    });

    //// render
    await unittest.renderGraph(cache.graph ?? new Graph(), undefined, false);

    //// setup options
    const isProduction = ENV === "production";
    const storeOptions: BoardStoresOptions = {
      constantsOpt: {
        env: ENV as BoardStoresOptions["constantsOpt"]["env"],
      },
    };
    if (isProduction) {
      Logger.isDebug = false;
    } else {
      storeOptions.debug = {
        selecting: true,
        selectingDetails: false,
      };
    }

    //// setup board store
    await useBoardStore(
      unittest.api,
      {
        apiInfo: {},
        groupCode: "",
        modelCodes: [""],
      },
      storeOptions,
    );

    // post settings
    const { setGuidelineSystem } = useFlags();
    setGuidelineSystem(true);
    BoardStore.board.keyboardPluginNullable?.setConfig({
      preventDefaultKeys: {
        AltLeft: true,
        MetaLeft: true,
        BracketLeft: true,
        BracketRight: true,
      },
      ctrlPreventDefaultKeys: {
        KeyA: true,
        KeyZ: true,
      },
    });
  }

  useEffect(() => {
    _initialize();
  }, []);
}
