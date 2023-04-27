import { useEffect } from "react";

import { Logger, UnitTest, waitUntil } from "@carefree0910/core";
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
import { pythonStore } from "@/stores/_python";

export function useInitBoard(): void {
  async function _initialize(): Promise<void> {
    if (initStore.working) return;
    initStore.updateProperty("working", true);

    // setup unittest to help initialization
    const unittest = new UnitTest(NoliNativeBoard, BOARD_CONTAINER_ID, initStore.boardOptions);

    // render
    await unittest.renderEmpty(1, false, !IS_PROD);

    // setup options
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

    // setup board store
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
