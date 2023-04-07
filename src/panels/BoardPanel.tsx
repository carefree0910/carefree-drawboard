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
        {makePlugin("task", {
          w: 200,
          h: 140,
          src: "https://ailab-huawei-cdn.nolibox.com/upload/images/ec388e38bdac4f72978b895c2f686cdf.png",
          task: "txt2img.sd",
          fields: ["prompt"],
          nodeConstraint: "none",
          pivot: "left",
          follow: false,
        })}
      </>
    </Flex>
  );
}

export default observer(BoardPanel);
