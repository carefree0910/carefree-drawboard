export interface IPythonResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
