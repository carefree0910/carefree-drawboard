import { observer } from "mobx-react-lite";
import { forwardRef, useState, useCallback } from "react";
import { Box, Button, ButtonProps, ChakraComponent, Image, ImageProps } from "@chakra-ui/react";

import iconLoading from "@/assets/icon-loading.json";
import { Event } from "@/utils/event";
import { VISIBILITY_TRANSITION } from "@/utils/constants";
import { themeStore } from "@/stores/theme";
import { settingsStore } from "@/stores/settings";
import CFLottie from "./CFLottie";
import CFTooltip from "./CFTooltip";

function CFButton(props: ButtonProps) {
  const { textColor } = themeStore.styles;

  return <Button color={textColor} flexShrink={0} {...props}></Button>;
}
interface ICFButtonWithBusyProps extends ButtonProps {
  busy: boolean;
  tooltip: string;
}
export function CFButtonWithBusyTooltip({ busy, tooltip, ...others }: ICFButtonWithBusyProps) {
  return (
    <CFTooltip label={busy ? tooltip : undefined} shouldWrapChildren>
      <CFButton w="100%" isDisabled={busy} {...others} />
    </CFTooltip>
  );
}
export interface IIconLoadedEvent {
  id: string;
}
export const iconLoadedEvent = new Event<IIconLoadedEvent>();
interface ICFIconButton extends ButtonProps {
  id: string;
  src?: string;
  imageProps?: ImageProps;
}
export const CFIconButton = observer(
  forwardRef(({ id, src, imageProps, children, ...others }: ICFIconButton, ref) => {
    const [iconLoaded, setIconLoaded] = useState(false);
    const onIconLoaded = useCallback(() => {
      iconLoadedEvent.emit({ id });
      setIconLoaded(true);
    }, [id]);

    const { lottieColors } = themeStore.styles;
    const iconLoadingPatience =
      settingsStore.boardSettings?.globalSettings?.iconLoadingPatience ?? 100;

    iconLoading.layers.forEach((layer) => {
      if (!layer.shapes) return;
      if (layer.shapes[0].it[1].c?.k) {
        layer.shapes[0].it[1].c.k = lottieColors.iconLoadingColor;
      }
    });

    return (
      <Box as="button" id={id} {...others} ref={ref}>
        <Image
          src={src}
          w="100%"
          h="100%"
          draggable={false}
          visibility={iconLoaded ? "visible" : "hidden"}
          transition={VISIBILITY_TRANSITION}
          onLoad={onIconLoaded}
          {...imageProps}
        />
        {children}
        <CFLottie
          w="100%"
          h="100%"
          position="absolute"
          left="0px"
          top="0px"
          hide={iconLoaded}
          delay={iconLoadingPatience}
          animationData={iconLoading}
        />
      </Box>
    );
  }),
) as ChakraComponent<"button", {}>;

export default observer(CFButton);
