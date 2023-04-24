import { observer } from "mobx-react-lite";
import { CircularProgress, CircularProgressProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

export const CFPendingProgress = observer((props: CircularProgressProps) => {
  const {
    circularProgressColors: { pendingColor },
  } = themeStore.styles;

  return <CircularProgress color={pendingColor} {...props} />;
});
export const CFWorkingProgress = observer((props: CircularProgressProps) => {
  const {
    circularProgressColors: { workingColor },
  } = themeStore.styles;

  return <CircularProgress color={workingColor} {...props} />;
});
