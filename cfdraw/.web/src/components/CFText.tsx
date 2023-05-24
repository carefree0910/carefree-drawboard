import { forwardRef } from "react";
import { observer } from "mobx-react-lite";
import { Text, TextProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

const CFText = forwardRef(function (props: TextProps, ref) {
  const { textColor } = themeStore.styles;

  return <Text ref={ref} color={textColor} {...props} />;
});
export const CFCaption = observer(
  forwardRef(function (props: TextProps, ref) {
    const { captionColor } = themeStore.styles;

    return <CFText color={captionColor} {...props} ref={ref} />;
  }),
);

export default observer(CFText);
