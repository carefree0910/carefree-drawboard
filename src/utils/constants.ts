type ENV_TYPE = "test" | "uat" | "production";
export const ENV: ENV_TYPE = import.meta.env.REACT_APP_ENV as ENV_TYPE;

export const BOARD_CONTAINER_ID = "board.container";
export const VISIBILITY_TRANSITION =
  "opacity 0.3s cubic-bezier(.08,.52,.52,1), visibility 0.3s cubic-bezier(.08,.52,.52,1)";

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

export const PYTHON_RELATED_SETTINGS = {
  backendPort: 8123,
};
