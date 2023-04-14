import type { TextareaProps } from "@chakra-ui/react";

import type { Dictionary, INode, Matrix2DFields } from "@noli/core";

import type { IMeta } from "./meta";
import type { IPlugin, IPluginInfo } from "./plugins";
import type { IDefinitions } from "./metaFields";

// general

export interface IUsePythonInfo extends IPythonPluginInfo {
  isInvisible: boolean;
  getDeps?: (deps: IUsePythonInfo) => any[];
}
export interface IPythonHttpPluginCallbacks<R> {
  onUseHttpPythonSuccess: (res: IPythonHttpResponse<R>) => Promise<void>;
  onUseHttpPythonError?: (err: any) => Promise<void>;
  beforeRequest?: () => Promise<void>;
  getExtraRequestData?: () => Dictionary<any>;
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
  submitToastMessage?: string;
}
export interface IPythonHttpPluginWithSubmit<R>
  extends IPythonPlugin,
    IPythonHttpPluginCallbacks<R> {
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

// http

export interface IUseHttpPython<R> extends IUsePythonInfo, IPythonHttpPluginCallbacks<R> {
  forceNotSend?: boolean;
}
export interface IPythonHttpResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
