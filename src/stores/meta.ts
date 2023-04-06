import { computed, makeObservable, observable } from "mobx";

import { shallowCopy } from "@noli/core";
import { ABCStore } from "@noli/business";

import type { IMetaData, SDSamplers, SDVersions, VariationModel } from "@/types/meta";
import type { APISources } from "@/types/requests";

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
  // specific data
  isDrag = false;
  timestamp?: number;

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
      isDrag: this.isDrag,
      timestamp: this.timestamp,
    });
  }
}

export const metaStore = new MetaStore();
