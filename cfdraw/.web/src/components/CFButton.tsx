import { observer } from "mobx-react-lite";
import { Button, ButtonProps, Tooltip } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

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
    <Tooltip label={busy ? tooltip : ""} hasArrow shouldWrapChildren>
      <CFButton w="100%" isDisabled={busy} {...others} />
    </Tooltip>
  );
}

export default observer(CFButton);
