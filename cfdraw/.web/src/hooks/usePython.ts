import { useCallback } from "react";

import type { ExportBlobOptions } from "@carefree0910/svg";
import { BBox, argMax } from "@carefree0910/core";
import { IGetNodeData, getNodeData, getNodeDataList } from "@carefree0910/components";

import type { IPythonSocketRequest, IUsePythonInfo, IUseSocketPython } from "@/schema/_python";
import { getBaseURL } from "@/utils/misc";
import { userStore } from "@/stores/user";
import { useWebSocketHook } from "@/requests/hooks";

type IGetPythonRequest = ExportBlobOptions & { noExport?: boolean };
export async function getPythonRequest({
  node,
  nodes,
  identifier,
  getExtraRequestData,
  opt = {},
  needExportNodeData,
  exportFullImages,
}: Omit<IUsePythonInfo, "isInvisible"> & {
  opt?: IGetPythonRequest;
}): Promise<Omit<IPythonSocketRequest, "hash">> {
  let exportBox: BBox | undefined;
  if (!opt.noExport) {
    exportBox = exportFullImages
      ? undefined
      : nodes.length === 0
      ? node?.bbox ?? BBox.unit()
      : nodes.length === 1
      ? nodes[0].bbox
      : nodes[argMax(nodes.map((n) => n.bbox.area))].bbox;
  }
  const getNodeDataOpt: IGetNodeData = { exportBox, forceExport: exportFullImages, ...opt };
  const nodeData = needExportNodeData ? await getNodeData(node, getNodeDataOpt) : {};
  const nodeDataList =
    !needExportNodeData || nodes.length <= 1 ? [] : await getNodeDataList(nodes, getNodeDataOpt);
  return {
    userId: userStore.userId,
    userJson: userStore.json,
    baseURL: getBaseURL("_python"),
    identifier,
    nodeData,
    nodeDataList,
    extraData: getExtraRequestData ? getExtraRequestData() : {},
  };
}

/**
 * 通过 hash 来控制是否通信
 * > 当 hash 为 undefined 时，不会进行通信
 * > 否则，会创建一个 task，其唯一标识即为 hash，然后向后端发起通信（任务）请求
 */
export function useSocketPython<R>({
  hash,
  node,
  nodes,
  identifier,
  isInvisible,
  retryInterval,
  updateInterval,
  getExtraRequestData,
  onMessage,
  onSocketError,
  needExportNodeData,
  exportFullImages,
}: IUseSocketPython<R>) {
  const deps = [
    hash,
    node?.alias,
    nodes.map((n) => n.alias).join("_"),
    identifier,
    retryInterval,
    updateInterval,
    isInvisible,
    getExtraRequestData,
  ];

  const getMessage = useCallback(
    () =>
      getPythonRequest({
        node,
        nodes,
        identifier,
        getExtraRequestData,
        needExportNodeData,
        exportFullImages,
      }).then((req) => ({ hash: hash!, ...req })),
    [deps],
  );

  const requestFn = useCallback(() => {
    useWebSocketHook({
      isInvisible,
      hash,
      getMessage,
      onMessage,
      onSocketError,
      retryInterval,
      updateInterval,
    });
  }, [getMessage, onMessage, onSocketError]);

  requestFn();
}
