import { useCallback, useEffect } from "react";

import { INode, Logger } from "@noli/core";

import type { IMeta } from "@/schema/meta";
import type { INodeData, IPythonResponse, IPythonRequest, IUseHttpPython } from "@/schema/_python";
import { Requests } from "@/requests/actions";

function getNodeData(node: INode | null): INodeData {
  if (!node) return {};
  const { x, y } = node.position;
  const { w, h } = node.wh;
  const transform = node.transform.fields;
  const text = node.type === "text" ? node.params.content : undefined;
  const src = node.type === "image" ? node.renderParams.src : undefined;
  const meta = (node.type === "group" ? undefined : node.params.meta) as IMeta | undefined;
  const children = node.type === "group" ? node.nodes.map(getNodeData) : undefined;
  return { type: node.type, x, y, w, h, transform, text, src, meta, children };
}

export function useHttpPython<R>({
  node,
  nodes,
  endpoint,
  identifier,
  isInvisible,
  updateInterval,
  forceNotSend,
  onUseHttpPythonSuccess,
  onUseHttpPythonError,
  beforeRequest,
  getExtraRequestData,
}: IUseHttpPython<R>) {
  const deps = [node, nodes, endpoint, identifier, updateInterval, isInvisible, forceNotSend];
  const requestFn = useCallback(() => {
    if (isInvisible || forceNotSend) return Promise.resolve();
    const preprocess = beforeRequest ? beforeRequest() : Promise.resolve();
    return preprocess
      .then(() => {
        Requests.postJson<IPythonResponse<R>, IPythonRequest>("_python", endpoint, {
          identifier,
          nodeData: getNodeData(node),
          nodeDataList: nodes.length <= 1 ? [] : nodes.map(getNodeData),
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
