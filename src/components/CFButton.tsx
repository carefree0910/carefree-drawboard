import { Button, ButtonProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

export function CFButton(props: ButtonProps) {
  const { textColor } = themeStore.styles;

  return <Button color={textColor} flexShrink={0} {...props}></Button>;
}
