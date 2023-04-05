import type { APISources, Interceptors } from "@/types/requests";
import { apis } from "../apis";
import { noliboxInceptors } from "./nolibox";

const interceptors: Record<APISources, Interceptors> = { nolibox: noliboxInceptors };

export function setupInceptors(): void {
  Object.entries(apis).forEach(([source, api]) => {
    const { beforeRequest, requestError, beforeResponse, responseError } =
      interceptors[source as APISources];
    api.interceptors.request.use(
      beforeRequest ?? ((config) => config),
      requestError ?? ((error) => Promise.reject(error)),
    );
    api.interceptors.response.use(
      beforeResponse ?? ((response) => response),
      responseError ?? ((error) => Promise.reject(error)),
    );
  });
}
