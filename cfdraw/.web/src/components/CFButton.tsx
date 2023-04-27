import { observer } from "mobx-react-lite";
import { Button, ButtonProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";
import CFTooltip from "./CFTooltip";

function CFButton(props: ButtonProps) {
  const { textColor } = themeStore.styles;

  return <Button color={textColor} flexShrink={0} {...props}></Button>;
}
interface ICFButtonWithBusyProps extends ButtonProps {
  busy: boolean;
  tooltip: string;
}
export function CFButtonWithBusyTooltip({ busy, tooltip, ...others }: ICFButtonWithBusyProps) {
  return (
    <CFTooltip label={busy ? tooltip : undefined} hasArrow shouldWrapChildren>
      <CFButton w="100%" isDisabled={busy} {...others} />
    </CFTooltip>
  );
}

export default observer(CFButton);
