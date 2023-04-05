export type MetaType = "upload";
export type SDVersions =
  | ""
  | "v1.5"
  | "anime"
  | "anime_anything"
  | "anime_hybrid"
  | "anime_guofeng"
  | "anime_orange"
  | "dreamlike_v1";
export type SDSamplers = "ddim" | "plms" | "klms" | "solver" | "k_euler" | "k_euler_a" | "k_heun";
export interface VariationModel {
  seed: number;
  strength: number;
}

export interface IMetaData {
  // common api data
  w: number;
  h: number;
  url: string;
  prompt: string;
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
  // specific data
  isDrag: boolean;
  timestamp?: number;
}

export interface IMeta {
  type: MetaType;
  data: IMetaData;
}
export interface IPartialMeta {
  type: IMeta["type"];
  data: Partial<IMeta["data"]>;
}
