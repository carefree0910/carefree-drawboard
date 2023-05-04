import type { TextareaProps } from "@chakra-ui/react";

import type { Dictionary, INode, Matrix2DFields } from "@carefree0910/core";

import type { IElapsedTimes, IMeta } from "./meta";
import type { PythonPlugins, IMakePlugin, IPlugin, IPluginInfo } from "./plugins";
import type { IDefinitions } from "./fields";
import type { IStr } from "./misc";

// general

interface IPythonPluginInfo extends IPluginInfo, IPythonSocketIntervals {
  name?: IStr;
  identifier: string;
}
export interface IPythonPlugin extends IPlugin {
  pluginInfo: IPythonPluginInfo;
}
interface IPythonCallbacks {
  getExtraRequestData?: () => Dictionary<any>;
}
export interface IUsePythonInfo extends IPythonPluginInfo, IPythonCallbacks {
  isInvisible: boolean;
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

interface IPythonPluginWithSubmitPluginInfo {
  closeOnSubmit?: boolean;
  toastOnSubmit?: boolean;
  toastMessageOnSubmit?: IStr;
}
export interface IPythonFieldsPlugin extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo &
    IPythonPluginWithSubmitPluginInfo & {
      header?: IStr;
      definitions: IDefinitions;
      numColumns?: number;
      noErrorToast?: boolean;
    };
}

export interface IPythonTextAreaPlugin extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo & {
    noLoading?: boolean;
    textAlign?: TextareaProps["textAlign"];
  };
}
export interface IPythonQAPlugin extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo & {
    initialText: IStr;
  };
}

export interface IPythonPluginGroup extends IPythonPlugin {
  pluginInfo: IPythonPluginInfo & {
    header?: IStr;
    plugins: IMakePlugin<PythonPlugins>[];
  };
}

export interface IPythonSocketPluginWithSubmit<R>
  extends Omit<IPythonPlugin, "id" | "pluginInfo">,
    Omit<IPythonSocketCallbacks<R>, "getMessage"> {
  id: string;
  buttonText: string;
  pluginInfo: IPythonPluginInfo & IPythonPluginWithSubmitPluginInfo;
}

// web

export interface IPythonSocketRequest {
  hash: string;
  userId: string;
  identifier: string;
  nodeData: INodeData;
  nodeDataList: INodeData[];
  extraData: Dictionary<any>;
  isInternal?: boolean;
}
export type IPythonOnSocketMessage<R> = (data: IPythonSocketMessage<R>) => Promise<
  | {
      newMessage?: () => Promise<IPythonSocketRequest>;
      /**
       * message generated by `newMessage` will be sent after `newMessageInterval` ms
       *
       * > if `newMessageInterval` is not provided, default `interval` (which is 1000)
       * will be used, which means the message will be sent after 1000ms by default.
       * > if you want to send the new message immediately, you can set it to 0.
       */
      newMessageInterval?: number;
    }
  | undefined
>;
export interface IPythonSocketIntervals {
  // if set, will retry in `retryInterval` ms when exception occurred
  retryInterval?: number;
  // if set, will re-send message every `updateInterval` ms
  updateInterval?: number;
}
export interface IPythonSocketCallbacks<R> extends IPythonCallbacks, IPythonSocketIntervals {
  getMessage: () => Promise<IPythonSocketRequest>;
  onMessage: IPythonOnSocketMessage<R>;
  onSocketError?: (err: any) => void;
}

export type PythonSocketStatus = "pending" | "working" | "finished" | "exception";
interface IPythonSocketIntermediate {
  imageList?: string[]; // intermediate images, if any
  textList?: string[]; // intermediate texts, if any
}
export interface IPythonSocketResponse<R> {
  progress?: number; // progress of current task, should be within [0, 1]
  intermediate?: IPythonSocketIntermediate;
  final?: R;
  elapsedTimes?: IElapsedTimes;
}
export interface IPythonSocketMessage<R> {
  hash: string;
  status: PythonSocketStatus;
  total: number;
  pending: number;
  message: string;
  data: IPythonSocketResponse<R>;
}
export interface IUseSocketPython<R>
  extends IUsePythonInfo,
    Omit<IPythonSocketCallbacks<R>, "getMessage"> {
  hash?: string;
}
