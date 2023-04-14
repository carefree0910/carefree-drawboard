import { useCallback, useEffect, useMemo } from "react";

import { INode, Logger } from "@noli/core";

import type { IMeta } from "@/schema/meta";
import type {
  INodeData,
  IPythonHttpResponse,
  IUseHttpPython,
  IUsePythonInfo,
} from "@/schema/_python";
import { Requests } from "@/requests/actions";

export function useDeps({
  node,
  nodes,
  endpoint,
  identifier,
  updateInterval,
  isInvisible,
  getDeps,
}: IUsePythonInfo) {
  return useMemo(
    () =>
      getDeps
        ? getDeps({ node, nodes, endpoint, identifier, updateInterval, isInvisible })
        : [node, nodes, endpoint, identifier, updateInterval, isInvisible],
    [node, nodes, endpoint, identifier, updateInterval, isInvisible],
  );
}

export function getNodeData(node: INode | null): INodeData {
  if (!node) return {};
  const { x, y } = node.position;
  const { w, h } = node.wh;
  const transform = node.transform.fields;
  const text = node.type === "text" ? node.params.content : undefined;
  const src = node.type === "image" ? node.renderParams.src : undefined;
  const meta = (node.type === "group" ? undefined : node.params.meta) as IMeta | undefined;
  return { type: node.type, x, y, w, h, transform, text, src, meta };
}

export function useHttpPython<R>({
  node,
  nodes,
  endpoint,
  identifier,
  isInvisible,
  updateInterval,
  getDeps,
  forceNotSend,
  onUseHttpPythonSuccess,
  onUseHttpPythonError,
  beforeRequest,
  getExtraRequestData,
}: IUseHttpPython<R>) {
  let deps = useDeps({ node, nodes, endpoint, identifier, updateInterval, isInvisible, getDeps });
  deps = deps.concat([forceNotSend]);
  const requestFn = useCallback(() => {
    if (isInvisible || forceNotSend) return Promise.resolve();
    const preprocess = beforeRequest ? beforeRequest() : Promise.resolve();
    return preprocess
      .then(() => {
        Requests.postJson<IPythonHttpResponse<R>>("_python", endpoint, {
          identifier,
          nodeData: getNodeData(node),
          extraData: getExtraRequestData ? getExtraRequestData() : {},
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
