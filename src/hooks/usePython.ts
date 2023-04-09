import { useCallback, useEffect } from "react";

import { Logger } from "@noli/core";

import type { IPythonPlugin } from "@/types/plugins";
import type { IPythonResponse } from "@/types/_python";
import { Requests } from "@/requests/actions";

export interface IUsePython {
  node: IPythonPlugin["pluginInfo"]["node"];
  endpoint: IPythonPlugin["pluginInfo"]["endpoint"];
  identifier: IPythonPlugin["pluginInfo"]["identifier"];
  isInvisible: boolean;
  updateInterval?: IPythonPlugin["pluginInfo"]["updateInterval"];
  onError?: (err: any) => Promise<void>;
}

export interface IUseHttpsPython<R> extends IUsePython {
  onSuccess: (res: IPythonResponse<R>) => Promise<void>;
  beforeRequest?: () => Promise<void>;
}

export function useHttpsPython<R>({
  node,
  endpoint,
  identifier,
  isInvisible,
  updateInterval,
  onSuccess,
  beforeRequest,
  onError,
}: IUseHttpsPython<R>) {
  const deps = [node, endpoint, identifier, updateInterval, isInvisible];
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
