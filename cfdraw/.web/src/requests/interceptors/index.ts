import type { APISources, APIs, Interceptors } from "@/schema/requests";
import { _pythonInceptors } from "./_python";

const interceptors: Record<APISources, Interceptors> = {
  _python: _pythonInceptors,
};

export function useInceptors(apis: APIs): void {
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
