import { Logger } from "@noli/core";

import type { APISources } from "@/types/requests";
import type { INarrowedMetaData } from "@/types/narrowedMeta";
import type { ITaskData, ITaskResponse, TaskTypes } from "@/types/tasks";
import { Requests } from "@/requests/actions";
import { getTaskData } from "./getTaskData";

export function pushTask<T extends TaskTypes>(
  task: T,
  metaData?: INarrowedMetaData[T],
): Promise<{ taskId: string; taskData: ITaskData[T] }> {
  const taskData = getTaskData(task, metaData);
  return Requests.postJson<{ uid: string }>(taskData.source, "/push", {
    task,
    params: taskData,
  }).then((res) => ({ taskId: res.uid, taskData }));
}

export class TaskPolling {
  source: APISources;
  taskId: string;
  response?: ITaskResponse;

  private timerId: any | null = null;
  private getStatusFailedCounter = 0;
  private getStatusFailedPatience = 3;
  private baseInterval = 1000;

  constructor(source: APISources, taskId: string) {
    this.source = source;
    this.taskId = taskId;
  }

  resolve: (response: ITaskResponse) => void = () => void 0;
  reject: (reason?: any) => void = () => void 0;

  run(): Promise<ITaskResponse> {
    return new Promise<ITaskResponse>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.getStatusFailedCounter = 0;
      this.timerId = setTimeout(this.check, 0);
    });
  }
  reset(taskId: string) {
    this.getStatusFailedCounter = 0;
    this.cancelLastCheck();
    this.taskId = taskId;
    this.timerId = setTimeout(this.check, 0);
  }
  check = async (): Promise<void> => {
    Requests.get<ITaskResponse>(this.source, `/status/${this.taskId}`)
      .then((res) => {
        this.response = res;
        if (res.status === "finished") {
          this.resolve(res);
        } else if (res.status === "exception") {
          this.reject(res.data?.reason);
        } else {
          this.timerId = setTimeout(this.check, this.getInterval(res));
        }
      })
      .catch((err) => {
        Logger.warn(`failed to get status (${err}), retrying...`);
        this.getStatusFailedCounter += 1;
        if (this.getStatusFailedCounter >= this.getStatusFailedPatience) throw Error;
        this.timerId = setTimeout(this.check, this.baseInterval);
      });
  };

  private getInterval(res: ITaskResponse): number {
    const base = this.baseInterval * (1.0 + Math.random());
    if (res.status === "working") return base;
    const factor = Math.max(1.0, res.pending);
    return factor * base;
  }
  private cancelLastCheck() {
    clearTimeout(this.timerId);
  }
}

export function pollTask<S extends APISources, T extends TaskTypes>(
  source: S,
  taskId: string,
  taskData: ITaskData[T],
): Promise<{ res: ITaskResponse; taskData: ITaskData[T] }> {
  return new TaskPolling(source, taskId).run().then((res) => ({ res, taskData }));
}
