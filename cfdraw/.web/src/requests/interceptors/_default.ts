import { Logger } from "@carefree0910/core";

import type { Interceptors } from "@/schema/requests";

export const useDefaultInceptors: (name: string) => Interceptors = (name) => ({
  beforeRequest: (config) => {
    if (Logger.isDebug) {
      Logger.debug(`[${config.url}] send to ${name}: ${JSON.stringify(config.data)}`);
    }
    config.headers["ngrok-skip-browser-warning"] = "";
    return config;
  },
  requestError(error) {
    if (Logger.isDebug) {
      Logger.debug(`send to ${name} error: ${error}`);
    }
    return Promise.reject(error);
  },
  beforeResponse(response) {
    if (Logger.isDebug) {
      Logger.debug(`receive from ${name}: ${JSON.stringify(response.data)}`);
    }
    return response;
  },
  responseError(error) {
    if (Logger.isDebug) {
      Logger.debug(`receive from ${name} error: ${error}`);
    }
    return Promise.reject(error);
  },
});
