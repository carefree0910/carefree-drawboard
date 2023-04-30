import lottie from "lottie-web";
import React, { useCallback, useEffect, useId } from "react";
import { Box, BoxProps } from "@chakra-ui/react";

interface ICFLottie extends BoxProps {
  hide?: boolean;
  delay?: number;
  animationData?: any;
}
const CFLottie: React.FC<ICFLottie> = ({ hide, delay, animationData, id, ...others }) => {
  const generatedId = useId();
  const finalId = id ?? generatedId;
  const loadLottie = useCallback(
    () =>
      lottie.loadAnimation({
        container: document.getElementById(finalId)!,
        animationData,
      }),
    [finalId, animationData],
  );

  useEffect(() => {
    let timer: any;
    const cleanup = () => clearTimeout(timer);
    if (hide) return cleanup;
    if (!delay) loadLottie();
    else timer = setTimeout(loadLottie, delay);
    return cleanup;
  }, [finalId, hide, delay, animationData]);

  return <>{!hide && <Box id={finalId} {...others} />}</>;
};

export default CFLottie;
