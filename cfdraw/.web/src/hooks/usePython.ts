import { useCallback } from "react";

import type { ExportBlobOptions } from "@carefree0910/svg";
import {
  BBox,
  HitTest,
  INode,
  IRectangleShapeNode,
  ISingleNode,
  argMax,
  isGroupNode,
  isUndefined,
} from "@carefree0910/core";
import { BoardStore, langStore, translate } from "@carefree0910/business";
import { Toast_Words } from "@carefree0910/components";

import type { IMeta } from "@/schema/meta";
import type {
  INodeData,
  IPythonSocketRequest,
  IUsePythonInfo,
  IUseSocketPython,
} from "@/schema/_python";
import { getBaseURL } from "@/utils/misc";
import { userStore } from "@/stores/user";
import { useWebSocketHook } from "@/requests/hooks";
import { Exporter } from "@/actions/export";
import { uploadImage } from "@/actions/uploadImage";

type IGetPythonRequest = ExportBlobOptions & { noExport?: boolean };
type IGetNodeData = ExportBlobOptions & { exportBox?: BBox };
async function getSrcFrom(nodes: ISingleNode[], opt: IGetNodeData): Promise<string> {
  opt.exportOptions ??= {};
  opt.exportOptions.exportBox = opt.exportBox;
  return Exporter.exportBlob(nodes, opt)
    .then((blob) => {
      if (!blob) throw Error("export blob failed");
      return uploadImage(blob, { failed: async () => void 0 });
    })
    .then((res) => {
      if (!res) throw Error("upload image failed");
      return res.url;
    });
}
async function getBlankNodeSrc(node: IRectangleShapeNode, opt: IGetNodeData): Promise<string> {
  const graph = BoardStore.graph.snapshot();
  const bbox = node.bbox;
  const overlapped = graph.allSingleNodes.filter(
    (n) => n.alias !== node.alias && n.zIndex < node.zIndex && HitTest.test(bbox, n.bbox),
  );
  if (overlapped.length === 0) {
    throw Error(translate(Toast_Words["no-overlapped-node-message"], langStore.tgt));
  }
  let src;
  if (overlapped.length === 1) {
    src = await getNodeSrc(overlapped[0], opt);
  } else {
    src = await getSrcFrom(overlapped, opt);
  }
  if (isUndefined(src)) {
    throw Error(`get src for '${node.alias}' Node failed`);
  }
  return src;
}
async function getNodeCommonData(node: INode, opt: IGetNodeData): Promise<INodeData> {
  const { x, y } = node.position;
  const { w, h } = node.wh;
  const z = isGroupNode(node) ? undefined : node.zIndex;
  const transform = node.transform.fields;
  const text = node.type === "text" ? node.params.content : undefined;
  const meta = (isGroupNode(node) ? undefined : node.params.meta) as IMeta | undefined;
  const children = isGroupNode(node) ? await getNodeDataList(node.nodes, opt) : undefined;
  return { type: node.type, x, y, w, h, z, transform, text, meta, children };
}
async function getNodeSrc(node: INode, opt: IGetNodeData): Promise<string | undefined> {
  if (!opt.exportBox) return;
  let src: string | undefined = undefined;
  if (node.type === "rectangle" && (node.params.meta as IMeta).type === "add.blank") {
    src = await getBlankNodeSrc(node, opt);
  } else if (node.type === "image" && node.bbox.closeTo(opt.exportBox)) {
    src = node.renderParams.src;
  } else if (node.type === "svg" && node.bbox.closeTo(opt.exportBox)) {
    src = node.params.src;
  } else if (node.type === "path" || node.type === "image" || node.type === "svg") {
    // should export the graphic `Node` as an image based on the `exportBox`
    src = await getSrcFrom([node], opt);
  }
  return src;
}
export async function getNodeData(node: INode | null, opt: IGetNodeData): Promise<INodeData> {
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
  needExportNodeData,
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
