import lottie from "lottie-web";
import React, { PropsWithChildren, useEffect } from "react";
import { Box, Center, Flex, Spacer } from "@chakra-ui/react";

import { useIsReady } from "@carefree0910/business";

import { VISIBILITY_TRANSITION } from "@/utils/constants";
import { useSettingsSynced } from "@/stores/settings";
import { themeStore } from "@/stores/theme";
import loadingPage from "@/assets/loading-page.json";

const CFLoading: React.FC<PropsWithChildren> = ({ children }) => {
  const id = "loading-animation";
  const isReady = useIsReady();
  const isSynced = useSettingsSynced();
  const { boardBg } = themeStore.styles;

  useEffect(() => {
    if (!isSynced) return;
    lottie.loadAnimation({
      container: document.getElementById(id)!,
      animationData: loadingPage,
    });
  }, [isSynced]);

  return (
    <>
      {children}
      {useSettingsSynced() && (
        <Flex
          w="100%"
          h="100%"
          bg={boardBg}
          zIndex="1000"
          position="absolute"
          direction="column"
          alignContent="center"
          opacity={isReady ? 0 : 1}
          visibility={isReady ? "hidden" : "visible"}
          transition={VISIBILITY_TRANSITION}>
          <Spacer />
          <Center>
            <Box id={id} />
          </Center>
          <Spacer />
        </Flex>
      )}
    </>
  );
};

export default CFLoading;
