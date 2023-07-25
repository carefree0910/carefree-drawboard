import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import { useIsReady } from "@carefree0910/business";

import { useReactPluginSettings } from "@/_settings";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { themeStore } from "@/stores/theme";
import { settingsStore, usePythonPluginSettings } from "@/stores/settings";
import MakePlugin from "@/plugins";

function BoardPanel() {
  const ref = useRef(null);
  const isReady = useIsReady();
  const { boardBg } = themeStore.styles;
  const Wrapper = settingsStore.internalSettings?.useStrictMode ? React.StrictMode : React.Fragment;

  return (
    <>
      <Flex h="100%" flex={1} direction="column">
        <Box w="100%" h="100%" bg={boardBg}>
          <Box
            id={BOARD_CONTAINER_ID}
            visibility={isReady ? "visible" : "hidden"}
            w="100%"
            h="100%"
          />
        </Box>
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
    </>
  );
}

export default observer(BoardPanel);
