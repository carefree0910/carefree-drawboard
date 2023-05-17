import { forwardRef } from "react";
import { observer } from "mobx-react-lite";
import { Text, TextProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

const CFText = forwardRef(function (props: TextProps, ref) {
  const { textColor } = themeStore.styles;

  return <Text ref={ref} color={textColor} {...props} />;
});
export const CFLabel = observer(
  forwardRef(function ({ label, ...props }: TextProps & { label?: string }, ref) {
    return (
      <>
        {label && (
          <CFText minW="20%" align="center" fontSize="14px" flexShrink={0} {...props} ref={ref}>
            {label}
          </CFText>
        )}
      </>
    );
  }),
);

export default observer(CFText);
