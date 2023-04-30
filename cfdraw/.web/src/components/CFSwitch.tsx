import { observer } from "mobx-react-lite";
import { useMemo, ReactElement } from "react";
import {
  FlexProps,
  FormControl,
  FormLabel,
  FormLabelProps,
  Spacer,
  Switch,
} from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";

import { themeStore } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

interface ICFSwitch extends FlexProps {
  label: string;
  value: boolean;
  setValue: (value: boolean) => void;
  tooltip?: ReactElement;
  disableSwitch?: boolean;
  formLabelProps?: FormLabelProps;
}
function CFSwitch({
  label,
  value,
  setValue,
  tooltip,
  disableSwitch,
  formLabelProps,
  ...props
}: ICFSwitch) {
  const hashId = useMemo(() => getRandomHash().toString(), []);
  const {
    textColor,
    switchColors: { checkedBgColor, uncheckedBgColor },
  } = themeStore.styles;

  return (
    <FormControl display="flex" alignItems="center" {...props}>
      <CFTooltip label={tooltip}>
        <FormLabel
          mb="0"
          color={textColor}
          fontSize={props.fontSize ?? "14px"}
          htmlFor={hashId}
          userSelect="none"
          {...formLabelProps}>
          {label}
        </FormLabel>
      </CFTooltip>
      <Spacer />
      <Switch
        id={hashId}
        sx={{
          "span.chakra-switch__track": { backgroundColor: checkedBgColor },
          "span.chakra-switch__track:not([data-checked])": { backgroundColor: uncheckedBgColor },
        }}
        isChecked={value}
        disabled={disableSwitch}
        onChange={(e: { target: { checked: boolean } }) => setValue(e.target.checked)}
      />
    </FormControl>
  );
}

export default observer(CFSwitch);
