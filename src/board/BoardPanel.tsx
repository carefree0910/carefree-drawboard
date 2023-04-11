import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import { useIsReady } from "@noli/business";

import { themeStore } from "@/stores/theme";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { makePlugin } from "@/plugins";
import { reactPluginSettings } from "./_react";
import getPythonPluginSettings from "./_python";

function BoardPanel() {
  const ref = useRef(null);
  const isReady = useIsReady();
  const { boardBg } = themeStore.styles;

  return (
    <>
      <Flex h="100%" flex={1} direction="column">
        <Box w="100%" h="100%" bg={boardBg}>
          <Box id={BOARD_CONTAINER_ID} visibility={isReady ? "visible" : "hidden"}></Box>
        </Box>
        <>
          {reactPluginSettings.map((settings) =>
            makePlugin({ key: settings.type, containerRef: ref, ...settings }),
          )}
          {getPythonPluginSettings().map((settings) =>
            makePlugin({
              key: settings.props.pluginInfo.identifier,
              containerRef: ref,
              ...settings,
            }),
          )}
        </>
      </Flex>
      <Box ref={ref} position="absolute"></Box>
    </>
  );
}

export default observer(BoardPanel);
