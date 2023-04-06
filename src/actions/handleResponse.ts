import { isUndefined } from "@noli/core";

import type { ITaskResponse } from "@/types/tasks";

export function getSingleUrl(res: ITaskResponse): string {
  if (isUndefined(res.data)) throw Error("`data` not found in response");
  if (!res.data.safe) throw Error(`generated image is not safe: ${res.data.reason}`);
  return res.data.cdn;
}
