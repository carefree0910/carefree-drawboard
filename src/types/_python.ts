import type { IPythonPlugin } from "./plugins";

export interface IPythonResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IUsePythonInfo {
  node: IPythonPlugin["pluginInfo"]["node"];
  endpoint: IPythonPlugin["pluginInfo"]["endpoint"];
  identifier: IPythonPlugin["pluginInfo"]["identifier"];
  isInvisible: boolean;
  updateInterval?: IPythonPlugin["pluginInfo"]["updateInterval"];
}
export interface IUsePython extends IUsePythonInfo {
  onError?: (err: any) => Promise<void>;
  getDeps?: (deps: IUsePythonInfo) => any[];
}
export interface IUseHttpPython<R> extends IUsePython {
  forceNotSend?: boolean;
  onSuccess: (res: IPythonResponse<R>) => Promise<void>;
  beforeRequest?: () => Promise<void>;
}
