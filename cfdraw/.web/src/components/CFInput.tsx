import { observer } from "mobx-react-lite";
import { Input, InputProps, UseNumberInputProps, useNumberInput } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

interface ICFInput extends InputProps {
  tooltip?: string;
  useNumberInputProps?: UseNumberInputProps;
}
function CFInput({ tooltip, useNumberInputProps, ...props }: ICFInput) {
  const { textColor, captionColor } = themeStore.styles;
  const numberInputProps = useNumberInput(useNumberInputProps).getInputProps();

  return (
    <CFTooltip label={tooltip}>
      <Input
        {...numberInputProps}
        color={textColor}
        _placeholder={{ color: captionColor }}
        flexShrink={0}
        {...props}
      />
    </CFTooltip>
  );
}

export default observer(CFInput);
