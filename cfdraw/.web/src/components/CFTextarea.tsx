import { observer } from "mobx-react-lite";
import { Textarea, TextareaProps } from "@chakra-ui/react";

import { themeStore } from "@/stores/theme";

function CFTextarea(props: TextareaProps) {
  const { textColor } = themeStore.styles;

  return <Textarea color={textColor} {...props} />;
}

export default observer(CFTextarea);
