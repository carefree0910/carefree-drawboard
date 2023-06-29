import type { BoxProps } from "@chakra-ui/react";

import ImagePlaceholder from "@/assets/image-placeholder.svg";
import NSFWImagePlaceholder from "@/assets/nsfw-placeholder.svg";

export const IS_PROD = import.meta.env.PROD;

export const BOARD_CONTAINER_ID = "board.container";

function useCubicBezier(second: number) {
  return `${second}s cubic-bezier(.08,.52,.52,1)`;
}
function useVisiblilityTransition(second: number) {
  const cubic_bezier = useCubicBezier(second);
  return `opacity ${cubic_bezier}, visibility ${cubic_bezier}`;
}
interface IMakeVisibilityTransitionProps {
  visible: boolean;
  second?: number;
  opacity?: BoxProps["opacity"];
  extraTransitions?: string;
}
export function useVisibilityTransitionProps({
  visible,
  second,
  opacity,
  extraTransitions,
}: IMakeVisibilityTransitionProps): {
  visibility: BoxProps["visibility"];
  transition: BoxProps["transition"];
  opacity: BoxProps["opacity"];
} {
  second ??= 0.3;
  opacity ??= 1.0;
  const baseTransition = useVisiblilityTransition(second);
  const transition = !!extraTransitions ? `${baseTransition}, ${extraTransitions}` : baseTransition;
  return { visibility: visible ? "visible" : "hidden", transition, opacity: visible ? opacity : 0 };
}
export const BG_TRANSITION = `background ${useCubicBezier(0.3)}`;
const expand_cubic_bezier = useCubicBezier(0.3);
export const EXPAND_TRANSITION = `height ${expand_cubic_bezier}, transform ${expand_cubic_bezier}, margin-top ${expand_cubic_bezier}`;

export const DEFAULT_PLUGIN_SETTINGS = {
  iconW: 48,
  iconH: 48,
  pivot: "bottom",
  follow: false,
  bgOpacity: 0.5,
  expandOpacity: 0.94117647,
  offsetX: 8,
  offsetY: 8,
  expandOffsetX: 8,
  expandOffsetY: 8,
};

export const IMAGE_PLACEHOLDER = ImagePlaceholder;
export const NSFW_IMAGE_PLACEHOLDER = NSFWImagePlaceholder;
export const DEFAULT_FONT_SIZE = 64;

export const DEFAULT_GAP = 12;
export const DEFAULT_FIELD_H = 42;
