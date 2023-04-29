import { Logger } from "@carefree0910/core";

import type { Interceptors } from "@/schema/requests";

export const _pythonInceptors: Interceptors = {
  beforeRequest: (config) => {
    if (Logger.isDebug) {
      Logger.debug(`[${config.url}] send to Python: ${JSON.stringify(config.data)}`);
    }
    config.headers["ngrok-skip-browser-warning"] = "";
    return config;
  },
  requestError(error) {
    if (Logger.isDebug) {
      Logger.debug(`send to Python error: ${error}`);
    }
    return Promise.reject(error);
  },
  beforeResponse(response) {
    if (Logger.isDebug) {
      Logger.debug(`receive from Python: ${JSON.stringify(response.data)}`);
    }
    return response;
  },
  responseError(error) {
    if (Logger.isDebug) {
      Logger.debug(`receive from Python error: ${error}`);
    }
    return Promise.reject(error);
  },
};
