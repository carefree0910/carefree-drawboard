import type { AxiosInstance } from "axios";

import type { APISources, Interceptors } from "@/schema/requests";
import { useDefaultInceptors } from "./_default";

export function useInceptors(
  api: AxiosInstance,
  source: APISources,
  interceptors?: Interceptors,
): void {
  const { beforeRequest, requestError, beforeResponse, responseError } =
    interceptors ?? useDefaultInceptors(source);
  api.interceptors.request.use(
    beforeRequest ?? ((config) => config),
    requestError ?? ((error) => Promise.reject(error)),
  );
  api.interceptors.response.use(
    beforeResponse ?? ((response) => response),
    responseError ?? ((error) => Promise.reject(error)),
  );
}
