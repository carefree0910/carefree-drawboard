import { useCallback, useEffect } from "react";
import { runInAction } from "mobx";

import {
  FOCUS_PLUGIN_NAME,
  GUIDELINE_SYSTEM_PLUGIN_NAME,
  getRandomHash,
  Logger,
  WATERMARK_PLUGIN_NAME,
  allInternalPlugins,
  getHash,
  sleep,
} from "@carefree0910/core";
import { langStore } from "@carefree0910/business";

import type { IPythonOnSocketMessage, IPythonSocketRequest } from "@/schema/_python";
import { ThemeType, allThemes, themeStore } from "@/stores/theme";
import { userStore } from "@/stores/user";
import { debugStore } from "@/stores/debug";
import { ISettingsStore, settingsStore } from "@/stores/settings";
import { useWebSocketHook } from "@/requests/hooks";
import { authEvent } from "@/components/CFAuth";

export function useIsSetup(): boolean {
  return !!userStore.userId && !!settingsStore.boardSettings;
}
export function useSetup(): void {
  useUserInitialization();
  useSyncPython();
}

// helper functions

//// prepare user information

// generate pseudo user id and postMessage.
// also pretend that the user id may need a few seconds to be fetched.
const postPseduoUserId = async (): Promise<void> => {
  await sleep(debugStore.pseduoWaitingTime);
  const USER_ID_KEY = "CFDRAW_USER_ID";
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = getRandomHash().toString();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  window.postMessage({ userId }, `http://localhost:${import.meta.env.VITE_CFDRAW_FE_PORT}`);
};

const useUserInitialization = () => {
  useEffect(() => {
    const { dispose } = authEvent.on(({ userId }) => {
      Logger.debug(`user id: ${userId}`);
      userStore.updateProperty("userId", userId);
    });
    if (debugStore.postPseduoUserId) {
      postPseduoUserId();
    }

    return dispose;
  }, []);
};

//// update settings, return `true` if settings hash is changed (which means rerendering is needed)
const updateSettings = (data: ISettingsStore): boolean => {
  const incomingHash = getHash(JSON.stringify(data)).toString();
  if (settingsStore.hash === incomingHash) return false;
  runInAction(() => {
    settingsStore.hash = incomingHash;
    settingsStore.pluginSettings = data.pluginSettings;
    // `internalSettings` should only be updated once.
    if (!settingsStore.internalSettings) {
      settingsStore.internalSettings = data.internalSettings;
    }
    // `boardSettings` should only be updated once.
    if (!settingsStore.boardSettings) {
      if (!data.boardSettings) return;
      //// Update theme styles
      Object.entries(data.boardSettings.styles ?? {}).forEach(([key, value]) => {
        if (value) {
          allThemes[key as ThemeType] = {
            ...allThemes[key as ThemeType],
            ...value,
          };
        }
      });
      //// Update board options, notice that this should always come after 'Update
      //// theme styles', because it uses `themeStore.styles.boardBg`.
      data.boardSettings.boardOptions = {
        autoResize: true,
        useDynamicScale: false,
        internalPlugins: [GUIDELINE_SYSTEM_PLUGIN_NAME].concat(allInternalPlugins),
        excludedPlugins: new Set([FOCUS_PLUGIN_NAME, WATERMARK_PLUGIN_NAME]),
        useGlobalClipboard: false, // TODO : test `true`
        backgroundColor: themeStore.styles.boardBg,
        fitContainerOptions: {
          targetFields: undefined,
        },
        bgMode: false, // TODO : test `true`
        ...data.boardSettings.boardOptions,
      };
      //// Update global settings
      const globalSettings = data.boardSettings.globalSettings ?? {};
      langStore.tgt = globalSettings.defaultLang ?? "en";
      globalSettings.defaultInfoTimeout ??= 300;
      data.boardSettings.globalSettings = globalSettings;
      //// setup property. Once `boardSettings` is set, drawboard will start rendering.
      settingsStore.boardSettings = data.boardSettings;
    }
  });
  return true;
};

//// sync from python
function useSyncPython() {
  const hash = "0";
  const getMessage = useCallback(
    (): Promise<IPythonSocketRequest> =>
      Promise.resolve({
        hash,
        userId: userStore.userId,
        identifier: "sync",
        nodeData: {},
        nodeDataList: [],
        extraData: {},
        isInternal: true,
      }),
    [],
  );
  const onMessage = useCallback<IPythonOnSocketMessage<ISettingsStore>>(
    async ({ status, total, pending, message, data: { progress, final } }) => {
      if (status !== "finished") {
        if (status === "pending") {
          Logger.warn(`sync pending: ${pending} / ${total}`);
        } else if (status === "working") {
          // Logger.warn(`sync in progress: ${progress}`);
        } else {
          Logger.warn(`sync failed: ${message}`);
          return { newMessage: getMessage };
        }
        return {};
      } else {
        if (!final) {
          Logger.warn("sync data not found");
          return { newMessage: getMessage };
        }
        if (updateSettings(final)) {
          Logger.log(`sync successfully: ${JSON.stringify(final)}, rerendering`);
        }
        return debugStore.pollSync ? { newMessage: getMessage } : {};
      }
    },
    [],
  );

  useWebSocketHook<ISettingsStore>({
    isInvisible: false,
    hash,
    getMessage,
    onMessage,
    isInternal: true,
  });
}
