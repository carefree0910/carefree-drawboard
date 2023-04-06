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
    source: meta.source,
  };
}

// get data api

export function getTaskData<T extends TaskTypes>(
  task: T,
  metaData?: INarrowedMetaData[T],
): ITaskData[T] {
  const converter = converters[task];
  return converter(metaData ?? metaStore.metaData);
}
