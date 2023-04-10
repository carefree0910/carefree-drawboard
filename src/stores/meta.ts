import { computed, makeObservable, observable } from "mobx";

import { Dictionary, shallowCopy } from "@noli/core";
import { ABCStore } from "@noli/business";

import type { IMetaData, ITomeInfo, SDSamplers, SDVersions, VariationModel } from "@/types/meta";
import type { APISources } from "@/types/requests";
import { allSubscribableFields } from "@/types/metaFields";

class MetaStore extends ABCStore<IMetaData> implements IMetaData {
  // common api data
  w = 512;
  h = 512;
  url: string = "";
  prompt: string = "";
  negative_prompt: string = "";
  version: SDVersions = "v1.5";
  sampler: SDSamplers = "k_euler";
  num_steps = 20;
  guidance_scale = 7.0;
  seed = -1;
  use_circular = false;
  max_wh = 1024;
  clip_skip = -1;
  variations: VariationModel[] = [];
  source: APISources = "nolibox";
  tome_info: Partial<ITomeInfo> = {};
  // specific data
  isDrag = false;
  duration?: number;
  timestamp?: number;
  externalData: Dictionary<any> = {};

  constructor() {
    super();
    makeObservable(this, {
      w: observable,
      h: observable,
      prompt: observable,
      negative_prompt: observable,
      version: observable,
      sampler: observable,
      num_steps: observable,
      guidance_scale: observable,
      seed: observable,
      use_circular: observable,
      max_wh: observable,
      clip_skip: observable,
      variations: observable,
      externalData: observable,
      metaData: computed,
    });
  }

  get info(): IMetaData {
    return this;
  }

  get metaData(): IMetaData {
    return shallowCopy({
      w: this.w,
      h: this.h,
      url: this.url,
      prompt: this.prompt,
      negative_prompt: this.negative_prompt,
      version: this.version,
      sampler: this.sampler,
      num_steps: this.num_steps,
      guidance_scale: this.guidance_scale,
      seed: this.seed,
      use_circular: this.use_circular,
      max_wh: this.max_wh,
      clip_skip: this.clip_skip,
      variations: this.variations,
      source: this.source,
      tome_info: this.tome_info,
      isDrag: this.isDrag,
      timestamp: this.timestamp,
      externalData: this.externalData,
    });
  }
}

const metaStore = new MetaStore();
type IInternalMetaKeys = keyof Omit<IMetaData, "externalData">;
type IExposedMetaKeys = IInternalMetaKeys | string;
type IMetaValue<T extends IExposedMetaKeys> = T extends IInternalMetaKeys ? IMetaData[T] : any;
export const getMetaData = () => metaStore.metaData;
export function getMetaField<T extends IExposedMetaKeys>(field: T): IMetaValue<T> {
  if (allSubscribableFields.includes(field)) {
    return (metaStore as any)[field];
  }
  return metaStore.externalData[field];
}
export function setMetaField<T extends IExposedMetaKeys>(field: T, value: IMetaValue<T>): void {
  if (allSubscribableFields.includes(field)) {
    metaStore.updateProperty(field as IInternalMetaKeys, value);
  } else {
    const externalData = shallowCopy(metaStore.externalData);
    externalData[field] = value;
    metaStore.updateProperty("externalData", externalData);
  }
}
