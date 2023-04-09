import { useCallback, useEffect, useMemo } from "react";

import { Logger } from "@noli/core";

import type { IPythonPlugin } from "@/types/plugins";
import type { IPythonResponse } from "@/types/_python";
import { Requests } from "@/requests/actions";

interface IUsePythonInfo {
  node: IPythonPlugin["pluginInfo"]["node"];
  endpoint: IPythonPlugin["pluginInfo"]["endpoint"];
  identifier: IPythonPlugin["pluginInfo"]["identifier"];
  isInvisible: boolean;
  updateInterval?: IPythonPlugin["pluginInfo"]["updateInterval"];
}
export interface IUsePython extends IUsePythonInfo {
  onError?: (err: any) => Promise<void>;
  getDeps?: (deps: IUsePythonInfo) => any[];
}

export interface IUseHttpPython<R> extends IUsePython {
  onSuccess: (res: IPythonResponse<R>) => Promise<void>;
  beforeRequest?: () => Promise<void>;
}

export function useDeps(
  { node, endpoint, identifier, updateInterval, isInvisible }: IUsePythonInfo,
  getDeps?: (deps: IUsePythonInfo) => any[],
) {
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
  onSuccess,
  beforeRequest,
  onError,
  getDeps,
}: IUseHttpPython<R>) {
  const deps = useDeps({ node, endpoint, identifier, updateInterval, isInvisible }, getDeps);
  const requestFn = useCallback(() => {
    if (isInvisible) return Promise.resolve();
    const preprocess = beforeRequest ? beforeRequest() : Promise.resolve();
    return preprocess
      .then(() =>
        Requests.postJson<IPythonResponse<R>>("_python", endpoint, {
          node: node?.toJsonPack(),
          identifier,
        }).then((res) => {
          if (res.success) onSuccess(res);
          else throw Error(res.message);
        }),
      )
      .catch((err) => {
        if (onError) onError(err);
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
