import type { ReactElement } from "react";

import type { Dictionary } from "@noli/core";

import { allSDSamplers, allSDVersions } from "./meta";
import { allAPISources } from "./requests";

export const allSubscribableFields = [
  "w",
  "h",
  "url",
  "prompt",
  "negative_prompt",
  "version",
  "sampler",
  "num_steps",
  "guidance_scale",
  "seed",
  "use_circular",
  "max_wh",
  "clip_skip",
  "variations",
  "tome_info",
  "source",
] as const;
export type ISubscribableFields = typeof allSubscribableFields[number];
export type IGeneralFields = ISubscribableFields | string;

export interface INumberField {
  type: "number";
  default: number;
  min?: number;
  max?: number;
  // slider
  step?: number;
  isInt?: boolean;
  scale?: "linear" | "logarithmic";
  label?: string | ReactElement;
  precision?: number;
}
export interface ISelectField<T> {
  type: "select";
  values: readonly T[];
  default: T;
}
export interface ITextField {
  type: "text";
}
export interface IBooleanField {
  type: "boolean";
  default: boolean;
}
export interface IListField {
  type: "list";
  item: Dictionary<IFieldDefinition>;
}
export interface IObjectField {
  type: "object";
  item: Dictionary<IFieldDefinition>;
}
export interface IImageField {
  type: "image";
}

export type _IFieldDefinition =
  | INumberField
  | ISelectField<any>
  | ITextField
  | IBooleanField
  | IListField
  | IObjectField
  | IImageField;
export type IFieldDefinition<T extends _IFieldDefinition = _IFieldDefinition> = T & { props?: any };
export type IFieldDefinitions = Record<ISubscribableFields, IFieldDefinition>;
export type ICustomDefinitions = Dictionary<IFieldDefinition>;

const seedDefinition: INumberField = {
  type: "number",
  default: -1,
  min: -1,
  max: 2 ** 32,
  step: 1,
  isInt: true,
};

export const defaultFieldDefinitions: IFieldDefinitions = {
  w: { type: "number", default: 512, min: 64, max: 1024, step: 64, isInt: true },
  h: { type: "number", default: 512, min: 64, max: 1024, step: 64, isInt: true },
  url: { type: "image" },
  prompt: { type: "text" },
  negative_prompt: { type: "text" },
  version: { type: "select", values: allSDVersions, default: "v1.5" },
  sampler: { type: "select", values: allSDSamplers, default: "k_euler" },
  num_steps: { type: "number", default: 20, min: 5, max: 100, step: 1, isInt: true },
  guidance_scale: { type: "number", default: 7.5, min: -10.0, max: 20.0, step: 0.5 },
  seed: seedDefinition,
  use_circular: { type: "boolean", default: false },
  max_wh: { type: "number", default: 1024, min: 64, max: 1024, step: 1, isInt: true },
  clip_skip: { type: "number", default: -1, min: -1, max: 4, step: 1, isInt: true },
  variations: {
    type: "list",
    item: {
      seed: seedDefinition,
      strength: { type: "number", default: 0.1, min: 0.0, max: 1.0, step: 0.01 },
    },
  },
  tome_info: {
    type: "object",
    item: {
      enable: { type: "boolean", default: false },
      ratio: { type: "number", default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
      max_downsample: { type: "number", default: 1, min: 1, max: 4, step: 1, isInt: true },
      sx: { type: "number", default: 2, min: 2, max: 8, step: 1, isInt: true },
      sy: { type: "number", default: 2, min: 2, max: 8, step: 1, isInt: true },
      seed: seedDefinition,
      use_rand: { type: "boolean", default: true },
      merge_attn: { type: "boolean", default: true },
      merge_crossattn: { type: "boolean", default: false },
      merge_mlp: { type: "boolean", default: false },
    },
  },
  source: { type: "select", values: allAPISources, default: "nolibox" },
};
