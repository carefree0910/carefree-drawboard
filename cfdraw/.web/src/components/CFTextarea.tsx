import { observer } from "mobx-react-lite";
import { Textarea, TextareaProps } from "@chakra-ui/react";

import { useInputProps } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

interface ICFTextarea extends TextareaProps {
  tooltip?: string;
}
function CFTextarea({ tooltip, ...props }: ICFTextarea) {
  return (
    <CFTooltip label={tooltip}>
      <Textarea {...useInputProps()} {...props} />
    </CFTooltip>
  );
}

export default observer(CFTextarea);
