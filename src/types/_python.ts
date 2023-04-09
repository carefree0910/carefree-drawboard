import type { IPythonPlugin } from "./plugins";

export interface IPythonHttpResponse<T> {
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
export interface IUseHttpPython<R> extends IUsePythonInfo {
  forceNotSend?: boolean;
  getDeps?: (deps: IUsePythonInfo) => any[];
  onHttpSuccess: (res: IPythonHttpResponse<R>) => Promise<void>;
  onHttpError?: (err: any) => Promise<void>;
  beforeRequest?: () => Promise<void>;
}
