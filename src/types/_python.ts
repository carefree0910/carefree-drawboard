import type { AvailablePythonPlugins, IPythonPluginProps } from "./plugins";

export interface IPythonResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface IMakePythonPlugin<T extends AvailablePythonPlugins> {
  type: T;
  props: Omit<IPythonPluginProps[T], "node">;
}
