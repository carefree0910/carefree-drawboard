import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export type APISources = "nolibox";
export type Interceptors = {
  // Do something before request is sent
  beforeRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  // Do something with request error
  requestError?: (error: any) => any;
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  beforeResponse?: (response: AxiosResponse) => AxiosResponse;
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  responseError?: (error: any) => any;
};
