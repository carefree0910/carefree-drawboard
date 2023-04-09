import type { Dictionary } from "@noli/core";

import type { IPythonPlugin } from "./plugins";

export interface IUsePythonInfo {
  node: IPythonPlugin["pluginInfo"]["node"];
  endpoint: IPythonPlugin["pluginInfo"]["endpoint"];
  identifier: IPythonPlugin["pluginInfo"]["identifier"];
  isInvisible: boolean;
  updateInterval?: IPythonPlugin["pluginInfo"]["updateInterval"];
  getDeps?: (deps: IUsePythonInfo) => any[];
}

// http
export interface IUseHttpPython<R> extends IUsePythonInfo {
  forceNotSend?: boolean;
  onUseHttpPythonSuccess: (res: IPythonHttpResponse<R>) => Promise<void>;
  onUseHttpPythonError?: (err: any) => Promise<void>;
  beforeRequest?: () => Promise<void>;
  getRequestData?: () => Dictionary<any>;
}
export interface IPythonHttpResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
