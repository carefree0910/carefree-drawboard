import type { TaskTypes, ITaskData } from "@/types/tasks";
import type { INarrowedMetaData } from "@/types/narrowedMeta";
import { metaStore } from "@/stores/meta";

// converters

const converters: Record<TaskTypes, (meta: INarrowedMetaData[TaskTypes]) => ITaskData[TaskTypes]> =
  {
    "txt2img.sd": txt2imgSDDataConverter,
  };

function txt2imgSDDataConverter(meta: INarrowedMetaData["txt2img.sd"]): ITaskData["txt2img.sd"] {
  return {
    w: meta.w,
    h: meta.h,
    text: meta.prompt,
    negative_prompt: meta.negative_prompt,
    version: meta.version,
    sampler: meta.sampler,
    num_steps: meta.num_steps,
    guidance_scale: meta.guidance_scale,
    seed: meta.seed,
    use_circular: meta.use_circular,
    max_wh: meta.max_wh,
    clip_skip: meta.clip_skip,
    variations: meta.variations,
    tome_info: meta.tome_info,
    source: meta.source,
  };
}

// reverters

const reverters: Record<
  TaskTypes,
  (taskData: ITaskData[TaskTypes]) => INarrowedMetaData[TaskTypes]
> = {
  "txt2img.sd": txt2imgSDDataReverter,
};

function txt2imgSDDataReverter(taskData: ITaskData["txt2img.sd"]): INarrowedMetaData["txt2img.sd"] {
  return {
    w: taskData.w,
    h: taskData.h,
    prompt: taskData.text,
    negative_prompt: taskData.negative_prompt,
    version: taskData.version,
    sampler: taskData.sampler,
    num_steps: taskData.num_steps,
    guidance_scale: taskData.guidance_scale,
    seed: taskData.seed,
    use_circular: taskData.use_circular,
    max_wh: taskData.max_wh,
    clip_skip: taskData.clip_skip,
    variations: taskData.variations,
    tome_info: taskData.tome_info,
    source: taskData.source,
  };
}

// meta data -> task data api

export function getTaskData<T extends TaskTypes>(
  task: T,
  metaData?: INarrowedMetaData[T],
): ITaskData[T] {
  return converters[task](metaData ?? metaStore.metaData);
}

// task data -> meta data api

export function revertTaskData<T extends TaskTypes>(
  task: T,
  taskData: ITaskData[T],
): INarrowedMetaData[T] {
  return reverters[task](taskData);
}
