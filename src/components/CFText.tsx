import { Text, TextProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

export function CFText(props: TextProps) {
  const { textColor } = themeStore.styles;

  return <Text color={textColor} {...props}></Text>;
}
