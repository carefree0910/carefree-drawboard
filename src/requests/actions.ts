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
}
