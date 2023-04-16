import { observer } from "mobx-react-lite";
import { Button, ButtonProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

function CFButton(props: ButtonProps) {
  const { textColor } = themeStore.styles;

  return <Button color={textColor} flexShrink={0} {...props}></Button>;
}

export default observer(CFButton);
