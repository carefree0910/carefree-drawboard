import { useCallback, useEffect } from "react";

import { BBox, INode, INodes, Logger } from "@carefree0910/core";

import type { IMeta } from "@/schema/meta";
import type {
  INodeData,
  IPythonResponse,
  IPythonRequest,
  IUseHttpPython,
  IUsePythonInfo,
  IUseSocketPython,
  IPythonOnSocketMessage,
} from "@/schema/_python";
import { IPythonStore, updatePythonStore } from "@/stores/_python";
import { Requests } from "@/requests/actions";
import { useWebSocket } from "@/requests/hooks";
import { uploadImage } from "@/actions/uploadImage";
import { Exporter, IExportBlob } from "@/actions/export";

type IGetNodeData = IExportBlob & { exportBox: BBox };
async function getNodeData(node: INode | null, opt: IGetNodeData): Promise<INodeData> {
  if (!node) return {};
  const { x, y } = node.position;
  const { w, h } = node.wh;
  const transform = node.transform.fields;
  const text = node.type === "text" ? node.params.content : undefined;
  let src: string | undefined = undefined;
  if (node.type === "image") {
    src = node.renderParams.src;
  } else if (node.type === "path") {
    // should export the `PathNode` as an image based on the `exportBox`
    opt.exportOptions ??= {};
    opt.exportOptions.exportBox = opt.exportBox;
    src = await Exporter.exportBlob([node], opt)
      .then((blob) => {
        if (!blob) throw Error("export blob for `PathNode` failed");
        return uploadImage(opt.t, opt.lang, blob, { failed: async () => void 0 });
      })
      .then((res) => {
        if (!res) throw Error("upload image for `PathNode` failed");
        return res.url;
      });
  }
  const meta = (node.type === "group" ? undefined : node.params.meta) as IMeta | undefined;
  const children = node.type === "group" ? await getNodeDataList(node.nodes, opt) : undefined;
  return { type: node.type, x, y, w, h, transform, text, src, meta, children };
}
async function getNodeDataList(nodes: INode[], opt: IGetNodeData): Promise<INodeData[]> {
  return Promise.all(nodes.map((node) => getNodeData(node, opt)));
}
async function getPythonRequest({
  node,
  nodes,
  identifier,
  getExtraRequestData,
  opt,
}: Omit<IUsePythonInfo, "endpoint" | "isInvisible"> & {
  opt: IExportBlob;
}): Promise<IPythonRequest> {
  const exportBox = new INodes(nodes).bbox;
  const getNodeDataOpt: IGetNodeData = { exportBox, ...opt };
  const nodeData = await getNodeData(node, getNodeDataOpt);
  const nodeDataList = nodes.length <= 1 ? [] : await getNodeDataList(nodes, getNodeDataOpt);
  return {
    identifier,
    nodeData,
    nodeDataList,
    extraData: getExtraRequestData ? getExtraRequestData() : {},
  };
}

export function useHttpPython<R>({
  t,
  lang,
  send,
  node,
  nodes,
  endpoint,
  identifier,
  isInvisible,
  updateInterval,
  onUseHttpPythonSuccess,
  onUseHttpPythonError,
  beforeRequest,
  afterResponse,
  getExtraRequestData,
}: IUseHttpPython<R>) {
  // TODO : `deps` here is not fully correct, but `useHttpPython` will be
  // deprecated soon so maybe leave it as-is is OK.
  const deps = [
    t,
    lang,
    send,
    node?.alias,
    nodes.map((n) => n.alias).join("_"),
    endpoint,
    identifier,
    updateInterval,
    isInvisible,
  ];
  const requestFn = useCallback(() => {
    if (!send || isInvisible) return Promise.resolve();
    const preprocess = beforeRequest ? beforeRequest() : Promise.resolve();
    return preprocess
      .then(() =>
        getPythonRequest({
          node,
          nodes,
          identifier,
          getExtraRequestData,
          opt: { t, lang },
        }),
      )
      .then((req) => Requests.postJson<IPythonResponse<R>>("_python", endpoint, req))
      .then((res) => {
        if (res.success) return onUseHttpPythonSuccess(res);
        throw Error(res.message);
      })
      .then(() => afterResponse?.())
      .catch((err) => {
        if (onUseHttpPythonError) return onUseHttpPythonError(err);
        Logger.error(err);
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

/**
 * this function will integrate a simple but useful retry mechanism, so we only need to
 * focus on the core logics in `onMessage` function.
 */
export function useSocketPython<R>({
  t,
  lang,
  connectHash,
  node,
  nodes,
  endpoint,
  identifier,
  isInvisible,
  updateInterval,
  getExtraRequestData,
  onMessage,
  onSocketError,
}: IUseSocketPython<R>) {
  const deps = [
    t,
    lang,
    connectHash,
    node?.alias,
    nodes.map((n) => n.alias).join("_"),
    endpoint,
    identifier,
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
        opt: { t, lang },
      }),
    [deps],
  );

  const requestFn = useCallback(() => {
    useWebSocket({
      connectHash: isInvisible ? undefined : connectHash,
      getMessage,
      onMessage,
      onSocketError,
    });
  }, [...deps, onMessage, onSocketError]);

  requestFn();
}

export function useSyncPython() {
  const getMessage = useCallback(
    () =>
      Promise.resolve({
        identifier: "sync",
        nodeData: {},
        nodeDataList: [],
        extraData: {},
        isInternal: true,
      }),
    [],
  );
  const onMessage = useCallback<IPythonOnSocketMessage<IPythonStore>>(
    async ({
      data: {
        status,
        total,
        pending,
        message,
        data: { progress, final },
      },
    }) => {
      if (status !== "finished") {
        if (status === "pending") {
          Logger.warn(`sync pending: ${pending} / ${total}`);
        } else if (status === "working") {
          Logger.warn(`sync in progress: ${progress}`);
        } else {
          Logger.warn(`sync failed: ${message}`);
        }
      } else {
        if (!final) {
          Logger.warn("sync data not found");
          return { newMessage: getMessage };
        } else if (updatePythonStore(final)) {
          Logger.log(`sync successfully: ${JSON.stringify(final)}, rerendering`);
          return {};
        }
      }
    },
    [],
  );

  useWebSocket<IPythonStore>({ connectHash: 0, getMessage, onMessage });
}
