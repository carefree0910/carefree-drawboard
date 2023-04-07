import { observer } from "mobx-react-lite";
import { Box, Flex } from "@chakra-ui/react";

import { useIsReady } from "@noli/business";

import { themeStore } from "@/stores/theme";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { makePlugin } from "@/plugins";

function BoardPanel() {
  const isReady = useIsReady();
  const { boardBg } = themeStore.styles;

  return (
    <Flex h="100%" flex={1} direction="column">
      <Box w="100%" h="100%" bg={boardBg}>
        <Box id={BOARD_CONTAINER_ID} visibility={isReady ? "visible" : "hidden"}></Box>
      </Box>
      <>
        {makePlugin("meta", {
          w: 400,
          h: 400,
          p: "10px",
          iconW: 42,
          iconH: 42,
          src: "https://ailab-huawei-cdn.nolibox.com/upload/images/0ec1b08f9c3e4ef4813ecb80bebf3b42.png",
          pivot: "rt",
          follow: true,
          offsetY: -42,
          expandOffsetY: -400,
          nodeConstraint: "singleNode",
          requireNode: true,
        })}
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
      </>
    </Flex>
  );
}

export default observer(BoardPanel);
