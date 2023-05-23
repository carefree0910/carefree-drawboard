import { observer } from "mobx-react-lite";
import { FormLabel, FormLabelProps, Tooltip, TooltipProps } from "@chakra-ui/react";

import { isUndefined } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import { themeStore, useLabelProps } from "@/stores/theme";

function CFTooltip({ label, ...others }: TooltipProps) {
  if (typeof label === "string") {
    label = translate(label, langStore.tgt);
  }
  return <Tooltip hasArrow label={label} {...others} />;
}

interface ICFFormLabel extends FormLabelProps {
  label?: string;
  tooltip?: Omit<TooltipProps, "children">;
}
export const CFFormLabel = observer(({ label, tooltip, ...others }: ICFFormLabel) => {
  const { textColor } = themeStore.styles;

  if (isUndefined(label)) return null;
  return (
    <CFTooltip {...tooltip}>
      <FormLabel
        mb="0"
        color={textColor}
        userSelect="none"
        {...useLabelProps(others.fontSize)}
        {...others}>
        {label}
      </FormLabel>
    </CFTooltip>
  );
});

export default observer(CFTooltip);
