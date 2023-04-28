import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import { useIsReady } from "@carefree0910/business";

import { reactPluginSettings } from "@/_settings";
import { themeStore } from "@/stores/theme";
import { settingsStore, usePythonPluginSettings } from "@/stores/settings";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { makePlugin } from "@/plugins";

function BoardPanel() {
  const ref = useRef(null);
  const isReady = useIsReady();
  const { boardBg } = themeStore.styles;
  const Wrapper = settingsStore.internalSettings?.useStrictMode ? React.StrictMode : React.Fragment;

  return (
    <>
      <Flex h="100%" flex={1} direction="column">
        <Box w="100%" h="100%" bg={boardBg}>
          <Box id={BOARD_CONTAINER_ID} visibility={isReady ? "visible" : "hidden"}></Box>
        </Box>
        <Wrapper>
          {reactPluginSettings.map((settings) =>
            makePlugin({ key: settings.type, containerRef: ref, ...settings }),
          )}
          {usePythonPluginSettings().map((settings) =>
            makePlugin({
              key: settings.props.pluginInfo.identifier,
              containerRef: ref,
              ...settings,
            }),
          )}
        </Wrapper>
      </Flex>
      <Box ref={ref} position="absolute"></Box>
    </>
  );
}

export default observer(BoardPanel);
