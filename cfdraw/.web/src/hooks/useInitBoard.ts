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
  waitUntil,
} from "@carefree0910/core";
import { SVGUnitTest } from "@carefree0910/svg";
import { NoliNativeBoard } from "@carefree0910/native";
import {
  BoardStore,
  BoardStoresOptions,
  useFlags,
  useBoardStore,
  useIsReady,
} from "@carefree0910/business";

import { BOARD_CONTAINER_ID, IS_PROD } from "@/utils/constants";
import { initStore } from "@/stores/init";
import { themeStore } from "@/stores/theme";
import { pythonStore } from "@/stores/_python";

export function useInitBoard(): void {
  async function _initialize(): Promise<void> {
    if (initStore.working) return;
    initStore.updateProperty("working", true);

    // pre settings
    Logger.isDebug = !IS_PROD;

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
    const storeOptions: BoardStoresOptions = {
      constantsOpt: {
        env: IS_PROD ? "production" : "development",
      },
    };
    if (!IS_PROD) {
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

    // done
    initStore.updateProperty("working", false);
  }

  useEffect(() => {
    Logger.isDebug = !IS_PROD;
    if (!useIsReady()) {
      waitUntil(() => !!pythonStore.boardSettings).then(() => {
        _initialize();
      });
    }
  }, []);
}
