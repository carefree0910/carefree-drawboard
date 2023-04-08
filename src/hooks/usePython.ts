import { useEffect } from "react";

import { Logger } from "@noli/core";

import type { IPythonPlugin } from "@/types/plugins";
import type { IPythonResponse } from "@/types/_python";
import { Requests } from "@/requests/actions";

export interface IUsePython<R> {
  node: IPythonPlugin["node"];
  endpoint: IPythonPlugin["endpoint"];
  identifier: IPythonPlugin["identifier"];
  onSuccess: (res: IPythonResponse<R>) => Promise<void>;
  beforeRequest?: () => Promise<void>;
  onError?: (err: any) => Promise<void>;
}

export function usePython<R>({
  node,
  endpoint,
  identifier,
  onSuccess,
  beforeRequest,
  onError,
}: IUsePython<R>) {
  useEffect(() => {
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
      });
  }, [node, endpoint, identifier]);
}
