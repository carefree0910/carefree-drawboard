import type { ImageURLs } from "@noli/core";

import type { ITomeInfo, SDSamplers, SDVersions, VariationModel } from "./meta";
import type { APISources } from "./requests";

interface ITxt2ImgSDTaskData {
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
  tome_info: Partial<ITomeInfo>;
  source: APISources;
}

export type TaskTypes = "txt2img.sd";
export interface ITaskData {
  "txt2img.sd": ITxt2ImgSDTaskData;
}

export interface ITaskResponse {
  status: "pending" | "working" | "finished" | "exception";
  pending: number;
  data?: ImageURLs & {
    response?: {
      text?: string;
      prompts?: string[];
      hint_urls?: string[];
      hint_reasons?: string[];
      result_urls?: string[];
      result_reasons?: string[];
    };
    create_time?: number;
    start_time?: number;
    end_time?: number;
    duration?: number;
  };
}
