import type { Dictionary, Lang } from "@noli/core";

import type { IToast } from "./misc";

// general

export const allMetaTypes = ["upload", "python.httpFields", "add.text"] as const;
export type MetaType = typeof allMetaTypes[number];
export interface ICommonMetaData {
  timestamp?: number;
  duration?: number;
  from?: IMeta;
}
export interface IMeta {
  type: MetaType;
  data: ICommonMetaData & Dictionary<any>;
}

// specific

interface IUploadMetaData extends ICommonMetaData {
  w: number;
  h: number;
  url: string;
  isDrag: boolean;
}
interface IAddTextMetaData extends ICommonMetaData {}
export type IPythonHttpFieldsResponse = { _duration?: number } & (
  | { type: "text"; value: string[] }
  | { type: "image"; value: { w: number; h: number; url: string }[] }
);
export type IPythonHttpFieldsMetaData = ICommonMetaData & {
  identifier: string;
  parameters: Dictionary<any>;
  response: IPythonHttpFieldsResponse;
};

export interface IMetaData {
  upload: IUploadMetaData;
  "add.text": IAddTextMetaData;
  "python.httpFields": IPythonHttpFieldsMetaData;
}

export interface IImportMeta<T extends MetaType> {
  t: IToast;
  lang: Lang;
  type: T;
  metaData: IMetaData[T];
}

// utils

export function checkMeta(meta: any): meta is IMeta {
  return allMetaTypes.includes(meta?.type);
}
export function getOriginMeta(meta: any): IMeta | undefined {
  if (!checkMeta(meta)) return;
  return getOriginMeta(meta.data.from);
}
