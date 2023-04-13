import type { APISources, Interceptors } from "@/schema/requests";
import { apis } from "../apis";
import { noliboxInceptors } from "./nolibox";
import { _pythonInceptors } from "./_python";

const interceptors: Record<APISources, Interceptors> = {
  nolibox: noliboxInceptors,
  _python: _pythonInceptors,
};

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
