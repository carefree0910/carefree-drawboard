import type { APISources } from "@/types/requests";
import { apis } from "./apis";

export class Requests {
  static get<T extends APISources, R = unknown>(source: T, endpoint: string): Promise<R> {
    return apis[source].get(endpoint).then((res) => res.data);
  }

  static postJson<T extends APISources, R = unknown>(
    source: T,
    endpoint: string,
    data: any,
  ): Promise<R> {
    return apis[source].post(endpoint, data).then((res) => res.data);
  }
}
