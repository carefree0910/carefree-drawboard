export const IS_PROD = import.meta.env.PROD;

export const BOARD_CONTAINER_ID = "board.container";
export function makeVisiblilityTransition(second: number) {
  return `opacity ${second}s cubic-bezier(.08,.52,.52,1), visibility ${second}s cubic-bezier(.08,.52,.52,1)`;
}
export const VISIBILITY_TRANSITION = makeVisiblilityTransition(0.3);
export const BG_TRANSITION = "background-color 0.3s ease-in-out";

export const DEFAULT_PLUGIN_SETTINGS = {
  iconW: 48,
  iconH: 48,
  pivot: "bottom",
  follow: false,
  bgOpacity: 0.5,
  modalOpacity: 0.94117647,
  offsetX: 8,
  offsetY: 8,
  expandOffsetX: 8,
  expandOffsetY: 8,
};

export const IMAGE_PLACEHOLDER =
  "https://user-images.githubusercontent.com/15677328/235604347-4d34d88d-0e82-49d7-8e36-fb182647c5fa.svg";
