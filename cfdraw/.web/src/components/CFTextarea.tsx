import { observer } from "mobx-react-lite";
import { Textarea, TextareaProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

interface ICFTextarea extends TextareaProps {
  tooltip?: string;
}
function CFTextarea({ tooltip, ...props }: ICFTextarea) {
  const { textColor } = themeStore.styles;

  return (
    <CFTooltip label={tooltip}>
      <Textarea color={textColor} {...props} />
    </CFTooltip>
  );
}

export default observer(CFTextarea);
