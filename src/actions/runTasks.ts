import type { APISources } from "@/types/requests";
import type { TaskTypes } from "@/types/tasks";
import { Requests } from "@/requests/actions";
import { getTaskData } from "./getTaskData";

export function pushTask<T extends TaskTypes, S extends APISources>(
  source: S,
  task: T,
): Promise<string> {
  return Requests.postJson<S, { uid: string }>(source, "/push", {
    task,
    params: getTaskData(task),
  }).then((res) => res.uid);
}
