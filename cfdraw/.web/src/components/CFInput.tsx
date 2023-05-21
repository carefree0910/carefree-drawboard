import { observer } from "mobx-react-lite";
import { Input, InputProps, UseNumberInputProps, useNumberInput } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

export interface ICFInput extends InputProps {
  tooltip?: string;
  useNumberInputProps?: UseNumberInputProps;
}
function CFInput({ tooltip, useNumberInputProps, ...props }: ICFInput) {
  const {
    textColor,
    captionColor,
    inputColors: { activeBorderColor },
  } = themeStore.styles;
  const numberInputProps = useNumberInput(useNumberInputProps).getInputProps();

  return (
    <CFTooltip label={tooltip}>
      <Input
        {...numberInputProps}
        color={textColor}
        borderWidth="1px"
        borderRadius="0px"
        _placeholder={{ color: captionColor }}
        _focusVisible={{
          borderColor: activeBorderColor,
          boxShadow: `0 0 0 1px ${activeBorderColor}`,
        }}
        flexShrink={0}
        {...props}
      />
    </CFTooltip>
  );
}

export default observer(CFInput);
