import { observer } from "mobx-react-lite";
import { Text, TextProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

function CFText(props: TextProps) {
  const { textColor } = themeStore.styles;

  return <Text color={textColor} {...props} />;
}
export const CFCaption = observer(({ label, ...props }: TextProps & { label?: string }) => {
  return (
    <>
      {label && (
        <CFText minW="20%" align="center" fontSize="14px" flexShrink={0} {...props}>
          {label}
        </CFText>
      )}
    </>
  );
});

export default observer(CFText);
