import { observer } from "mobx-react-lite";
import { useUnmount } from "ahooks";
import { Textarea, TextareaProps } from "@chakra-ui/react";

import { useInputProps } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

interface ICFTextarea extends TextareaProps {
  tooltip?: string;
  onUnmount?: () => void;
}
function CFTextarea({ tooltip, onUnmount, ...props }: ICFTextarea) {
  useUnmount(() => onUnmount?.());

  return (
    <CFTooltip label={tooltip}>
      <Textarea {...useInputProps()} {...props} />
    </CFTooltip>
  );
}

export default observer(CFTextarea);
