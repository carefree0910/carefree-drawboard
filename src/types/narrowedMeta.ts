import type { useToast } from "@chakra-ui/toast";

import type { Dictionary, Lang } from "@noli/core";

import type {
  IMetaData,
  ITomeInfo,
  MetaType,
  SDSamplers,
  SDVersions,
  VariationModel,
} from "./meta";
import type { APISources } from "./requests";

interface IUploadMetaData extends Partial<IMetaData> {
  w: number;
  h: number;
  url: string;
  isDrag: boolean;
  timestamp?: number;
}
interface ITxt2ImgSDMetaData extends Partial<IMetaData> {
  w: number;
  h: number;
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
  tome_info: Partial<ITomeInfo>;
  source: APISources;
  timestamp?: number;
}
export type IPythonHttpFieldsResponse =
  | { type: "text"; value: string }
  | { type: "image"; value: { w: number; h: number; url: string }[] };
export type IPythonHttpFieldsData = Dictionary<any> & { externalData: Dictionary<any> };
type IPythonHttpFieldsMetaData = IPythonHttpFieldsResponse & {
  identifier: string;
  data: IPythonHttpFieldsData;
};

export interface INarrowedMetaData {
  upload: IUploadMetaData;
  "txt2img.sd": ITxt2ImgSDMetaData;
  "python.httpFields": IPythonHttpFieldsMetaData;
}

export interface IImportMeta<T extends MetaType> {
  t: ReturnType<typeof useToast>;
  lang: Lang;
  type: T;
  metaData: INarrowedMetaData[T];
}
