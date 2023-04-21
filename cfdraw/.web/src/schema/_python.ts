import type { TextareaProps } from "@chakra-ui/react";

import type { Dictionary, INode, Lang, Matrix2DFields } from "@carefree0910/core";

import type { IMeta } from "./meta";
import type { IToast } from "./misc";
import type { IPlugin, IPluginInfo } from "./plugins";
import type { IDefinitions } from "./metaFields";

// general

interface IPythonCallbacks {
  getExtraRequestData?: () => Dictionary<any>;
}
export interface IUsePythonInfo extends IPythonPluginInfo, IPythonCallbacks {
  isInvisible: boolean;
}
export interface IPythonHttpPluginCallbacks<R> extends IPythonCallbacks {
  onUseHttpPythonSuccess: (res: IPythonResponse<R>) => Promise<void>;
  onUseHttpPythonError?: (err: any) => Promise<void>;
  beforeRequest?: () => Promise<void>;
}
export interface INodeData {
  type?: INode["type"];
  // transform info
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  transform?: Matrix2DFields;
  // text info
  text?: string;
  // image info
  src?: string;
  // meta
  meta?: IMeta;
  // children, in case this is a `Group`
  children?: INodeData[];
}

// plugin

interface IPythonPluginInfo extends IPluginInfo {
  endpoint: string;
  identifier: string;
  updateInterval?: number;
}
export interface IPythonPlugin extends IPlugin {
  pluginInfo: IPythonPluginInfo;
}
interface IPythonHttpPluginWithSubmitPluginInfo {
  closeOnSubmit?: boolean;
  toastOnSubmit?: boolean;
  toastMessageOnSubmit?: string;
}
export interface IPythonHttpPluginWithSubmit<R>
  extends IPythonPlugin,
    IPythonHttpPluginCallbacks<R> {
  id: string;
  buttonText: string;
  pluginInfo: IPythonPluginInfo & IPythonHttpPluginWithSubmitPluginInfo;
}
export interface IPythonHttpTextAreaPlugin extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo & {
    noLoading?: boolean;
    textAlign?: TextareaProps["textAlign"];
  };
}
export interface IPythonHttpQAPlugin extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo & {
    initialText: string;
  };
}
export interface IPythonHttpFieldsPlugin extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo &
    IPythonHttpPluginWithSubmitPluginInfo & {
      header?: string;
      definitions: IDefinitions;
      numColumns?: number;
    };
}

// web

export interface IPythonRequest {
  identifier: string;
  nodeData: INodeData;
  nodeDataList: INodeData[];
  extraData: Dictionary<any>;
  isInternal?: boolean;
}
export interface IPythonResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface ISocketCallbacks<R> {
  getMessage: () => Promise<IPythonRequest>;
  onMessage: (
    data: IPythonSocketMessage<R>,
  ) => Promise<{ newMessage?: () => Promise<IPythonRequest>; interval?: number } | undefined>;
  onError?: (err: any) => void;
}

// http

export interface IUseHttpPython<R> extends IUsePythonInfo, IPythonHttpPluginCallbacks<R> {
  t: IToast;
  lang: Lang;
  forceNotSend?: boolean;
}

// socket

export type PythonSocketStatus = "pending" | "working" | "finished" | "exception";
export interface IPythonSocketData<R> {
  status: PythonSocketStatus;
  pending: number;
  data: R;
}
export interface IPythonSocketMessage<R> extends IPythonResponse<IPythonSocketData<R>> {}
export interface IUseSocketPython<R> extends IUsePythonInfo, ISocketCallbacks<R> {}
