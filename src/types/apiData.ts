import type { SDSamplers, SDVersions, VariationModel } from "./meta";

interface ITxt2ImgSDData {
  w: number;
  h: number;
  text: string;
  negative_prompt: string;
  version: SDVersions;
  sampler: SDSamplers;
  num_steps: number;
  guidance_scale: number;
  seed: number;
  use_circular: boolean;
  max_wh: number;
  clip_skip: number;
  variations: VariationModel[];
}

export type APITypes = "txt2img.sd";
export interface IAPIData {
  "txt2img.sd": ITxt2ImgSDData;
}
