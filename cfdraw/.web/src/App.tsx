import React, { useRef } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";

import { isUndefined, shallowCopy, waitUntil } from "@carefree0910/core";
import { NoliNativeBoard } from "@carefree0910/native";
import { BoardPanel } from "@carefree0910/components";

import MakePlugin from "./plugins";
import { useSetup } from "./hooks/useSetup";
import { useWebSocket } from "./stores/socket";
import { useGridLines } from "./hooks/useGridLines";
import { useDocumentEvents } from "./hooks/useDocumentEvents";
import { fetchImage } from "./actions/export";
import { uploadImage } from "./actions/uploadImage";
import { settingsStore, usePythonPluginSettings } from "./stores/settings";
import { useReactPluginSettings } from "./_settings";
import { initLangDirs } from "./lang";

function App() {
  useSetup();
  useWebSocket();
  useGridLines();
  useDocumentEvents();

  const ref = useRef(null);
  const Wrapper = settingsStore.internalSettings?.useStrictMode ? React.StrictMode : React.Fragment;

  return (
    <Flex h="100vh" className="p-editor" direction="column" userSelect="none">
      <Flex h="100%" flex={1} direction="column">
        <BoardPanel
          w="100%"
          h="100%"
          enableLoadingPage
          setupOptions={{
            isProd: false,
            exportFn: ({ url, jpeg }) => fetchImage({ url, jpeg }),
            uploadImageFn: async (blob) => {
              return uploadImage(blob, { failed: async () => void 0 });
            },
            uploadSVGFn: async (svg) => {
              return uploadImage(new Blob([svg], { type: "image/svg+xml" }), {
                isSVG: true,
                failed: async () => void 0,
              });
            },
            setupBeforeBoard: () =>
              waitUntil(() => !isUndefined(settingsStore.boardSettings)).then(() => {
                const { styles, boardOptions, globalSettings, initialProject } = shallowCopy(
                  settingsStore.boardSettings!,
                );
                return {
                  initialProject,
                  initBoardOptions: {
                    api: NoliNativeBoard,
                    boardSettings: {
                      styles,
                      boardOptions,
                      globalSettings,
                      boardStoreOptions: { constantsOpt: { token: undefined } },
                    },
                    internalSettings: settingsStore.internalSettings,
                  },
                };
              }),
            enableFileDropper: true,
            enablePreventDefaults: true,
            extraLangRecords: initLangDirs,
          }}
        />
        <Wrapper>
          {useReactPluginSettings().map((settings) => (
            <MakePlugin key={settings.type} containerRef={ref} {...settings} />
          ))}
          {usePythonPluginSettings().map((settings) => (
            <MakePlugin
              key={settings.props.pluginInfo.identifier}
              containerRef={ref}
              {...settings}
            />
          ))}
        </Wrapper>
      </Flex>
      <Box ref={ref} position="absolute"></Box>
    </Flex>
  );
}

export default observer(App);
