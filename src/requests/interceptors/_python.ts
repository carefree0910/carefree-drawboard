import { Logger } from "@noli/core";

import type { Interceptors } from "@/schema/requests";

export const _pythonInceptors: Interceptors = {
  beforeRequest: (config) => {
    if (Logger.isDebug) {
      Logger.debug(`send to Python: ${JSON.stringify(config.data)} (${config.url})`);
    }
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
