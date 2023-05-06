import { useCallback } from "react";

import type { ExportBlobOptions } from "@carefree0910/svg";
import { BBox, INode, argMax } from "@carefree0910/core";

import type { IMeta } from "@/schema/meta";
import type {
  INodeData,
  IPythonSocketRequest,
  IUsePythonInfo,
  IUseSocketPython,
} from "@/schema/_python";
import { userStore } from "@/stores/user";
import { useWebSocketHook } from "@/requests/hooks";
import { uploadImage } from "@/actions/uploadImage";
import { Exporter } from "@/actions/export";

type IGetPythonRequest = ExportBlobOptions & { noExport?: boolean };
type IGetNodeData = ExportBlobOptions & { exportBox?: BBox };
async function getNodeCommonData(node: INode, opt: IGetNodeData): Promise<INodeData> {
  const { x, y } = node.position;
  const { w, h } = node.wh;
  const transform = node.transform.fields;
  const text = node.type === "text" ? node.params.content : undefined;
  const meta = (node.type === "group" ? undefined : node.params.meta) as IMeta | undefined;
  const children = node.type === "group" ? await getNodeDataList(node.nodes, opt) : undefined;
  return { type: node.type, x, y, w, h, transform, text, meta, children };
}
async function getNodeSrc(node: INode, opt: IGetNodeData): Promise<string | undefined> {
  if (!opt.exportBox) return;
  let src: string | undefined = undefined;
  if (node.type === "image" && node.bbox.closeTo(opt.exportBox)) {
    src = node.renderParams.src;
  } else if (node.type === "svg" && node.bbox.closeTo(opt.exportBox)) {
    src = node.params.src;
  } else if (node.type === "path" || node.type === "image" || node.type === "svg") {
    // should export the graphic `Node` as an image based on the `exportBox`
    opt.exportOptions ??= {};
    opt.exportOptions.exportBox = opt.exportBox;
    src = await Exporter.exportBlob([node], opt)
      .then((blob) => {
        if (!blob) throw Error(`export blob for ${node.type} Node failed`);
        return uploadImage(blob, { failed: async () => void 0 });
      })
      .then((res) => {
        if (!res) throw Error(`upload image for ${node.type} Node failed`);
        return res.url;
      });
  }
  return src;
}
async function getNodeData(node: INode | null, opt: IGetNodeData): Promise<INodeData> {
  if (!node) return {};
  const common = await getNodeCommonData(node, opt);
  if (!opt.exportBox) return common;
  common.src = await getNodeSrc(node, opt);
  return common;
}
async function getNodeDataList(nodes: INode[], opt: IGetNodeData): Promise<INodeData[]> {
  return Promise.all(nodes.map((node) => getNodeData(node, opt)));
}
export async function getPythonRequest({
  node,
  nodes,
  identifier,
  getExtraRequestData,
  opt = {},
}: Omit<IUsePythonInfo, "isInvisible"> & {
  opt?: IGetPythonRequest;
}): Promise<Omit<IPythonSocketRequest, "hash">> {
  let exportBox: BBox | undefined;
  if (!opt.noExport) {
    exportBox =
      nodes.length === 0
        ? node?.bbox ?? BBox.unit()
        : nodes.length === 1
        ? nodes[0].bbox
        : nodes[argMax(nodes.map((n) => n.bbox.area))].bbox;
  }
  const getNodeDataOpt: IGetNodeData = { exportBox, ...opt };
  const nodeData = await getNodeData(node, getNodeDataOpt);
  const nodeDataList = nodes.length <= 1 ? [] : await getNodeDataList(nodes, getNodeDataOpt);
  return {
    userId: userStore.userId,
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
