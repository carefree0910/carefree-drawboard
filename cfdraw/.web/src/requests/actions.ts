import type { ResponseType } from "axios";

import type { Dictionary } from "@carefree0910/core";

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

  static postForm<R = unknown, T extends APISources = APISources>(
    source: T,
    endpoint: string,
    data: Dictionary<string | Blob>,
  ): Promise<R> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    return useAPI(source)
      .postForm(endpoint, formData)
      .then((res) => res.data);
  }

  static delete<T extends APISources = APISources>(source: T, endpoint: string): Promise<void> {
    return useAPI(source).delete(endpoint);
  }
}
