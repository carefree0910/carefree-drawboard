import lottie from "lottie-web";
import React, { useEffect, useId } from "react";
import { Box, BoxProps } from "@chakra-ui/react";

interface ICFLottie extends BoxProps {
  hide?: boolean;
  animationData?: any;
}
const CFLottie: React.FC<ICFLottie> = ({ hide, animationData, id, ...others }) => {
  const generatedId = useId();
  const finalId = id ?? generatedId;

  useEffect(() => {
    if (hide) return;
    lottie.loadAnimation({
      container: document.getElementById(finalId)!,
      animationData,
    });
  }, [finalId, hide, animationData]);

  return <Box id={finalId} {...others} />;
};

export default CFLottie;
