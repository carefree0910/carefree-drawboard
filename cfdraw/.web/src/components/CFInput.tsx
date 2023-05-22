import { observer } from "mobx-react-lite";
import { Input, InputProps, UseNumberInputProps, useNumberInput } from "@chakra-ui/react";

import { useInputProps } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

export interface ICFInput extends InputProps {
  tooltip?: string;
  useNumberInputProps?: UseNumberInputProps;
}
function CFInput({ tooltip, useNumberInputProps, ...props }: ICFInput) {
  const numberInputProps = useNumberInput(useNumberInputProps).getInputProps();

  return (
    <CFTooltip label={tooltip}>
      <Input {...numberInputProps} {...useInputProps()} {...props} />
    </CFTooltip>
  );
}

export default observer(CFInput);
