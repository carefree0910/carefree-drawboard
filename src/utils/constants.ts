type ENV_TYPE = "test" | "uat" | "production";
export const ENV: ENV_TYPE = import.meta.env.REACT_APP_ENV as ENV_TYPE;

export const BOARD_CONTAINER_ID = "board.container";
