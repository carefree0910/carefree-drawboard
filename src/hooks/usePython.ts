import { useCallback, useEffect, useMemo } from "react";

import { Logger } from "@noli/core";

import type { IPythonHttpResponse, IUseHttpPython, IUsePythonInfo } from "@/types/_python";
import { Requests } from "@/requests/actions";

export function useDeps({
  node,
  endpoint,
  identifier,
  updateInterval,
  isInvisible,
  getDeps,
}: IUsePythonInfo) {
  return useMemo(
    () =>
      getDeps
        ? getDeps({ node, endpoint, identifier, updateInterval, isInvisible })
        : [node, endpoint, identifier, updateInterval, isInvisible],
    [node, endpoint, identifier, updateInterval, isInvisible],
  );
}

export function useHttpPython<R>({
  node,
  endpoint,
  identifier,
  isInvisible,
  updateInterval,
  getDeps,
  forceNotSend,
  onUseHttpPythonSuccess,
  onUseHttpPythonError,
  beforeRequest,
  getRequestData,
}: IUseHttpPython<R>) {
  let deps = useDeps({ node, endpoint, identifier, updateInterval, isInvisible, getDeps });
  deps = deps.concat([forceNotSend]);
  const requestFn = useCallback(() => {
    if (isInvisible || forceNotSend) return Promise.resolve();
    const preprocess = beforeRequest ? beforeRequest() : Promise.resolve();
    return preprocess
      .then(() => {
        const data = getRequestData ? getRequestData() : {};
        Requests.postJson<IPythonHttpResponse<R>>("_python", endpoint, {
          identifier,
          data,
          node: node?.toJsonPack(),
        }).then((res) => {
          if (res.success) onUseHttpPythonSuccess(res);
          else throw Error(res.message);
        });
      })
      .catch((err) => {
        if (onUseHttpPythonError) onUseHttpPythonError(err);
        else Logger.error(err);
      });
  }, deps);

  useEffect(() => {
    let timer: any;
    let shouldIgnore = false; // IMPORTANT!
    function requestWithTimeout() {
      if (isInvisible || shouldIgnore) return;
      requestFn().then(() => (timer = setTimeout(requestWithTimeout, updateInterval)));
    }
    if (!updateInterval) requestFn();
    else requestWithTimeout();

    return () => {
      shouldIgnore = true;
      clearTimeout(timer);
    };
  }, deps);
}
