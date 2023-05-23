import { forwardRef } from "react";
import { observer } from "mobx-react-lite";
import { Text, TextProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

const CFText = forwardRef(function (props: TextProps, ref) {
  const { textColor } = themeStore.styles;

  return <Text ref={ref} color={textColor} {...props} />;
});

export default observer(CFText);
