import { observer } from "mobx-react-lite";
import { useMemo, ReactElement } from "react";
import {
  FormControl,
  FormControlProps,
  FormLabel,
  FormLabelProps,
  Spacer,
  Switch,
} from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";

import { themeStore } from "@/stores/theme";
import CFTooltip, { CFFormLabel } from "./CFTooltip";

interface ICFSwitch extends FormControlProps {
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
    switchColors: { checkedBgColor, uncheckedBgColor },
  } = themeStore.styles;

  return (
    <FormControl display="flex" alignItems="center" {...props}>
      <CFFormLabel
        label={label}
        tooltip={{ label: tooltip }}
        {...formLabelProps}
        htmlFor={hashId}
      />
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
