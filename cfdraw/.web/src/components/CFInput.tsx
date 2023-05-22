import { observer } from "mobx-react-lite";
import { Input, InputProps, UseNumberInputProps, useNumberInput } from "@chakra-ui/react";

import { isUndefined } from "@carefree0910/core";

import { useInputProps } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

export interface ICFInput extends InputProps {
  tooltip?: string;
  useNumberInputProps?: UseNumberInputProps;
}
function CFInput({ tooltip, useNumberInputProps, ...props }: ICFInput) {
  const numberInputProps = !isUndefined(useNumberInputProps)
    ? useNumberInput(useNumberInputProps).getInputProps()
    : undefined;

  return (
    <CFTooltip label={tooltip}>
      <Input {...numberInputProps} {...useInputProps()} {...props} />
    </CFTooltip>
  );
}

export default observer(CFInput);
