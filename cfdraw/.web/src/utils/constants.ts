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
export const GITHUB_ICON =
  "https://user-images.githubusercontent.com/15677328/234538604-3017a411-e5f1-4564-8bc0-5090e973d86b.svg";
export const EMAIL_ICON =
  "https://user-images.githubusercontent.com/15677328/234538781-b59b514f-99be-4ca2-859d-601f024cd7e0.svg";
