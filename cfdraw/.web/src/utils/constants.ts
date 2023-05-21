import type { BoxProps } from "@chakra-ui/react";

export const IS_PROD = import.meta.env.PROD;

export const BOARD_CONTAINER_ID = "board.container";

function makeCubicBezier(second: number) {
  return `${second}s cubic-bezier(.08,.52,.52,1)`;
}
function makeVisiblilityTransition(second: number) {
  const cubic_bezier = makeCubicBezier(second);
  return `opacity ${cubic_bezier}, visibility ${cubic_bezier}`;
}
interface IMakeVisibilityTransitionProps {
  visible: boolean;
  second?: number;
  opacity?: BoxProps["opacity"];
  extraTransitions?: string;
}
export function makeVisibilityTransitionProps({
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
  const baseTransition = makeVisiblilityTransition(second);
  const transition = !!extraTransitions ? `${baseTransition}, ${extraTransitions}` : baseTransition;
  return { visibility: visible ? "visible" : "hidden", transition, opacity: visible ? opacity : 0 };
}
export const BG_TRANSITION = "background-color 0.3s ease-in-out";
const expand_cubic_bezier = makeCubicBezier(0.3);
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

export const IMAGE_PLACEHOLDER =
  "https://user-images.githubusercontent.com/15677328/236621223-e3b508b9-5a60-471c-8630-470b7e6e8cde.svg";
export const NSFW_IMAGE_PLACEHOLDER =
  "https://user-images.githubusercontent.com/15677328/235883103-9a3941c0-d5d9-4064-9e28-ba0f07f6921f.svg";
export const DEFAULT_FONT_SIZE = 64;

// icons

export const SETTINGS_ICON =
  "https://user-images.githubusercontent.com/15677328/234536549-87e94432-9f25-490f-8dee-7ed166bcbeed.svg";
export const PROJECT_ICON =
  "https://user-images.githubusercontent.com/15677328/234536679-103c6d6a-f882-4a99-baaf-02f71fefeea5.svg";
export const ADD_ICON =
  "https://user-images.githubusercontent.com/15677328/234536800-4e2d9090-8958-4da9-8600-1e708f86759a.svg";
export const BRUSH_ICON =
  "https://user-images.githubusercontent.com/15677328/234537027-20b3ea26-a6d0-4e07-8186-e2649917a893.svg";
export const UNDO_ICON =
  "https://user-images.githubusercontent.com/15677328/234537508-b7ef4494-f2db-438b-b7cb-2f8d04833cb0.svg";
export const REDO_ICON =
  "https://user-images.githubusercontent.com/15677328/234537560-552bc9bc-b0dc-45a5-af77-f14a2f2dbf80.svg";
export const META_ICON =
  "https://user-images.githubusercontent.com/15677328/234533823-12d27a77-155a-4743-a0af-1fc5b86014fd.svg";
export const DOWNLOAD_ICON =
  "https://user-images.githubusercontent.com/15677328/234537900-4f52af0b-3be0-4a9a-b70b-ec28198323f0.svg";
export const DELETE_ICON =
  "https://user-images.githubusercontent.com/15677328/234538170-7374b2a1-edac-45c5-9615-96adf310a4c4.svg";
export const TEXT_EDITOR_ICON =
  "https://user-images.githubusercontent.com/15677328/234545067-1da07d56-9d53-4fbb-83cc-395ff953b4c6.svg";
export const GROUP_EDITOR_ICON =
  "https://user-images.githubusercontent.com/15677328/234545700-0d33471a-b43b-47af-a371-b2b3b8a98794.svg";
export const MULTI_EDITOR_ICON =
  "https://user-images.githubusercontent.com/15677328/234545875-ff953782-7a18-4e0a-997c-37522fcbd2fd.svg";
export const ARRANGE_ICON =
  "https://user-images.githubusercontent.com/15677328/234545341-870f888e-0dfc-4d8e-a79b-fcb9ddbe0977.svg";
export const WIKI_ICON =
  "https://user-images.githubusercontent.com/15677328/234538371-88891a34-1b30-4c2b-bd2e-a80e2030210d.svg";
export const EMAIL_ICON =
  "https://user-images.githubusercontent.com/15677328/234538781-b59b514f-99be-4ca2-859d-601f024cd7e0.svg";
export const GITHUB_ICON =
  "https://user-images.githubusercontent.com/15677328/234538604-3017a411-e5f1-4564-8bc0-5090e973d86b.svg";
export const SHORTCUTS_ICON =
  "https://github.com/carefree0910/carefree-drawboard/assets/15677328/f3eda420-1448-40a4-9db9-5ef198bb2a5a";

export const ADD_TEXT_ICON =
  "https://user-images.githubusercontent.com/15677328/236501259-c84127ef-91f3-4dc7-a505-2112ca519e54.svg";
export const ADD_IMAGE_ICON =
  "https://user-images.githubusercontent.com/15677328/236501264-448aae30-f2ea-433d-b35d-c7ce9e5c17ba.svg";
export const ADD_BLANK_ICON =
  "https://user-images.githubusercontent.com/15677328/236501253-068ae3c2-6852-41c7-aac1-bdaba3a9d794.svg";
export const ADD_PROJECT_ICON =
  "https://user-images.githubusercontent.com/15677328/236501256-9c8981c6-fa12-4ad7-b9be-a0578a0a9ce5.svg";
export const ADD_FRAME_ICON =
  "https://user-images.githubusercontent.com/15677328/236501262-f3dbf29c-05b0-46d3-9eee-1345a2eadaaf.svg";
