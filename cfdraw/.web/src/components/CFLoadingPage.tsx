import React, { PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";
import { Center, Flex, Spacer } from "@chakra-ui/react";

import { useIsReady } from "@carefree0910/business";

import loadingPage from "@/assets/lottie/loading-page.json";

import { useVisibilityTransitionProps } from "@/utils/constants";
import { themeStore } from "@/stores/theme";
import { useIsAllReady } from "@/hooks/useSetup";
import CFLottie from "./CFLottie";

const CFLoadingPage: React.FC<PropsWithChildren> = ({ children }) => {
  const isReady = useIsReady() && useIsAllReady();
  const { boardBg } = themeStore.styles;

  return (
    <>
      {children}
      <Flex
        w="100%"
        h="100%"
        bg={boardBg}
        zIndex="1000"
        position="absolute"
        direction="column"
        alignContent="center"
        {...useVisibilityTransitionProps({ visible: !isReady, second: 0.5 })}>
        <Spacer />
        <Center>
          <CFLottie animationData={loadingPage} />
        </Center>
        <Spacer />
      </Flex>
    </>
  );
};

export default observer(CFLoadingPage);
