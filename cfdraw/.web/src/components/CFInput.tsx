import { observer } from "mobx-react-lite";
import { Input, InputProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

function CFInput(props: InputProps) {
  const { textColor } = themeStore.styles;

  return <Input color={textColor} flexShrink={0} {...props} />;
}

export default observer(CFInput);
