import { useCallback, useEffect, useMemo } from "react";

import { Logger, isUndefined } from "@noli/core";

import type { IPythonPlugin } from "@/types/plugins";
import type { IPythonResponse } from "@/types/_python";
import { Requests } from "@/requests/actions";

export interface IUsePython<R> {
  node: IPythonPlugin["node"];
  endpoint: IPythonPlugin["endpoint"];
  identifier: IPythonPlugin["identifier"];
  updateInterval?: IPythonPlugin["updateInterval"];
  onSuccess: (res: IPythonResponse<R>) => Promise<void>;
  beforeRequest?: () => Promise<void>;
  onError?: (err: any) => Promise<void>;
}

export function usePython<R>({
  node,
  endpoint,
  identifier,
  updateInterval,
  onSuccess,
  beforeRequest,
  onError,
}: IUsePython<R>) {
  const deps = [node, endpoint, identifier, updateInterval];
  const requestFn = useCallback(
    () =>
      beforeRequest?.()
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
        }),
    deps,
  );

  useEffect(() => {
    let timer: any;
    let shouldIgnore = false; // IMPORTANT!
    function requestWithTimeout() {
      if (shouldIgnore) return;
      requestFn()?.then(() => (timer = setTimeout(requestWithTimeout, updateInterval)));
    }
    if (!updateInterval) requestFn();
    else requestWithTimeout();

    return () => {
      shouldIgnore = true;
      clearTimeout(timer);
    };
  }, deps);
}
