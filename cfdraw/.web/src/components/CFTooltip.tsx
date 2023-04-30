import { observer } from "mobx-react-lite";
import { Tooltip, TooltipProps } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

function CFTooltip({ label, ...others }: TooltipProps) {
  if (typeof label === "string") {
    label = translate(label, langStore.tgt);
  }
  return <Tooltip hasArrow label={label} {...others} />;
}

export default observer(CFTooltip);
