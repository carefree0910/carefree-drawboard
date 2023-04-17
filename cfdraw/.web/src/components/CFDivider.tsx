import { observer } from "mobx-react-lite";
import { Divider, DividerProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

function CFDivider(props: DividerProps) {
  const { dividerColor } = themeStore.styles;

  return <Divider my="12px" borderColor={dividerColor} {...props} />;
}

export default observer(CFDivider);
