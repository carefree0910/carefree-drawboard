import { observer } from "mobx-react-lite";
import { Text, TextProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

function CFText(props: TextProps) {
  const { textColor } = themeStore.styles;

  return <Text color={textColor} {...props}></Text>;
}

export default observer(CFText);
