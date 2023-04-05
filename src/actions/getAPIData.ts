import type { IMetaData } from "@/types/meta";
import type { APITypes, IAPIData } from "@/types/apiData";
import { metaStore } from "@/stores/meta";

// converters

const converters: Record<APITypes, (meta: IMetaData) => IAPIData[APITypes]> = {
  "txt2img.sd": txt2imgSDDataConverter,
};

function txt2imgSDDataConverter(meta: IMetaData): IAPIData["txt2img.sd"] {
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
  };
}

// get data api

export function getAPIData<T extends APITypes>(type: T): IAPIData[T] {
  const converter = converters[type];
  return converter(metaStore.metaData);
}
