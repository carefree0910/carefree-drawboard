type ENV_TYPE = "test" | "uat" | "production";
export const ENV: ENV_TYPE = import.meta.env.REACT_APP_ENV as ENV_TYPE;

export const BOARD_CONTAINER_ID = "board.container";
export const VISIBILITY_TRANSITION =
  "opacity 0.3s cubic-bezier(.08,.52,.52,1), visibility 0.3s cubic-bezier(.08,.52,.52,1)";
