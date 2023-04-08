import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import { useIsReady } from "@noli/business";

import { themeStore } from "@/stores/theme";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { makePlugin } from "@/plugins";
import { makePythonPlugin } from "@/plugins/_python";
import { pythonPluginSettings } from "./_python";

function BoardPanel() {
  const isReady = useIsReady();
  const { boardBg } = themeStore.styles;

  return (
    <Flex h="100%" flex={1} direction="column">
      <Box w="100%" h="100%" bg={boardBg}>
        <Box id={BOARD_CONTAINER_ID} visibility={isReady ? "visible" : "hidden"}></Box>
      </Box>
      <>
        {makePlugin("txt2img.sd", {
          w: 1000,
          h: 600,
          src: "https://ailab-huawei-cdn.nolibox.com/upload/images/ec388e38bdac4f72978b895c2f686cdf.png",
          fields: ["prompt"],
          nodeConstraint: "none",
          pivot: "left",
          follow: false,
          useModal: true,
          modalOpacity: 0.9,
        })}
        {makePlugin("settings", {
          w: 250,
          h: 400,
          src: "https://ailab-huawei-cdn.nolibox.com/upload/images/49223052f17f4f249c56ba00f43b3043.png",
          pivot: "rt",
          follow: false,
          nodeConstraint: "none",
        })}
        {pythonPluginSettings.map((settings) =>
          makePythonPlugin({ key: settings.props.identifier, ...settings }),
        )}
      </>
    </Flex>
  );
}

export default observer(BoardPanel);
