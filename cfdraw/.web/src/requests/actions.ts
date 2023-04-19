import type { ResponseType } from "axios";

import type { APISources } from "@/schema/requests";
import { useAPI } from "./hooks";

export class Requests {
  static get<R = unknown, T extends APISources = APISources>(
    source: T,
    endpoint: string,
  ): Promise<R> {
    return useAPI(source)
      .get(endpoint)
      .then((res) => res.data);
  }

  static postJson<R = unknown, D = any, T extends APISources = APISources>(
    source: T,
    endpoint: string,
    data: D,
    responseType: ResponseType = "json",
  ): Promise<R> {
    return useAPI(source)
      .post(endpoint, data, { responseType })
      .then((res) => res.data);
  }

  static postBlob<R = unknown, T extends APISources = APISources>(
    source: T,
    endpoint: string,
    { key, blob }: { key: string; blob: Blob },
  ): Promise<R> {
    const formData = new FormData();
    formData.append(key, blob);
    return useAPI(source)
      .postForm(endpoint, formData)
      .then((res) => res.data);
  }
}
