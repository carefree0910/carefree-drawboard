import type { Dictionary, Lang } from "@noli/core";

import type { IToast } from "./misc";

// general

export const allMetaTypes = ["upload", "python.httpFields", "add.text"] as const;
export type MetaType = typeof allMetaTypes[number];
export interface ICommonMetaData<T extends _IMetaData = _IMetaData> {
  timestamp?: number;
  duration?: number;
  from?: IMeta<T>;
}
type _IMetaData = ICommonMetaData & Dictionary<any>;
export interface IMeta<T extends _IMetaData = _IMetaData> {
  type: MetaType;
  data: T;
}

// specific

interface IUploadMetaData extends ICommonMetaData {
  w: number;
  h: number;
  url: string;
  isDrag: boolean;
}
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
  "add.text": ICommonMetaData;
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
