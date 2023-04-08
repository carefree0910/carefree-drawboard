import type { APISources } from "@/types/requests";
import { apis } from "./apis";

export class Requests {
  static get<R = unknown, T extends APISources = APISources>(
    source: T,
    endpoint: string,
  ): Promise<R> {
    return apis[source].get(endpoint).then((res) => res.data);
  }

  static postJson<R = unknown, T extends APISources = APISources>(
    source: T,
    endpoint: string,
    data: any,
  ): Promise<R> {
    return apis[source].post(endpoint, data).then((res) => res.data);
  }

  static postBlob<R = unknown, T extends APISources = APISources>(
    source: T,
    endpoint: string,
    { key, blob }: { key: string; blob: Blob },
  ): Promise<R> {
    const formData = new FormData();
    formData.append(key, blob);
    return apis[source].postForm(endpoint, formData).then((res) => res.data);
  }
}
