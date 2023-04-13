import type { TextareaProps } from "@chakra-ui/react";

import type { Dictionary, Matrix2DFields } from "@noli/core";

import type { IPlugin } from "./plugins";
import type { IDefinitions } from "./metaFields";

// general

export interface IUsePythonInfo {
  node: IPythonPlugin["pluginInfo"]["node"];
  endpoint: IPythonPlugin["pluginInfo"]["endpoint"];
  identifier: IPythonPlugin["pluginInfo"]["identifier"];
  isInvisible: boolean;
  updateInterval?: IPythonPlugin["pluginInfo"]["updateInterval"];
  getDeps?: (deps: IUsePythonInfo) => any[];
}
export interface IPythonHttpPluginCallbacks<R> {
  onUseHttpPythonSuccess: (res: IPythonHttpResponse<R>) => Promise<void>;
  onUseHttpPythonError?: (err: any) => Promise<void>;
  beforeRequest?: () => Promise<void>;
  getExtraRequestData?: () => Dictionary<any>;
}
export interface INodeData {
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
}

// plugin

export interface IPythonPlugin extends IPlugin {
  pluginInfo: IPlugin["pluginInfo"] & {
    endpoint: string;
    identifier: string;
    updateInterval?: number;
  };
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
  pluginInfo: IPythonPlugin["pluginInfo"] & IPythonHttpPluginWithSubmitPluginInfo;
}
export interface IPythonHttpTextAreaPlugin extends IPythonPlugin {
  pluginInfo: IPythonPlugin["pluginInfo"] & {
    noLoading?: boolean;
    textAlign?: TextareaProps["textAlign"];
  };
}
export interface IPythonHttpQAPlugin extends IPythonPlugin {
  pluginInfo: IPythonPlugin["pluginInfo"] & {
    initialText: string;
  };
}
export interface IPythonHttpFieldsPlugin extends IPythonPlugin {
  pluginInfo: IPythonPlugin["pluginInfo"] &
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
