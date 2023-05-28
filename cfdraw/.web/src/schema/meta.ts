import type { Dictionary, Lang } from "@carefree0910/core";

import type { IMetaInjections } from "@/stores/meta";

export interface IElapsedTimes {
  createTime?: number;
  startTime?: number;
  endTime?: number;
  pending?: number;
  executing?: number;
  upload?: number;
  total?: number;
}

// general

export const allMetaTypes = [
  "upload",
  "add.text",
  "add.blank",
  "add.sketch.path",
  "python.fields",
] as const;
export type MetaType = (typeof allMetaTypes)[number];
export interface ICommonMetaData<T extends _IMetaData = _IMetaData> {
  lang?: Lang;
  alias?: string;
  elapsedTimes?: IElapsedTimes;
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
  safe: boolean;
  reason: string;
  isDrag: boolean;
}
export type IPythonResults = (
  | { type: "text"; value: { text: string; safe: boolean; reason: string }[] }
  | { type: "image"; value: { w: number; h: number; url: string; safe: boolean; reason: string }[] }
) & { extra?: Dictionary<any> };
export type IPythonFieldsMetaData = ICommonMetaData & {
  identifier: string;
  response: IPythonResults & { index?: number };
  injections?: IMetaInjections;
};

export interface IMetaData {
  upload: IUploadMetaData;
  "add.text": ICommonMetaData;
  "add.blank": ICommonMetaData;
  "add.sketch.path": ICommonMetaData;
  "python.fields": IPythonFieldsMetaData;
}

export interface IImportMeta<T extends MetaType> {
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
export function getMetaTrace(meta: IMeta): IMeta[] {
  if (!checkMeta(meta)) return [];
  return [meta, ...(meta.data.from ? getMetaTrace(meta.data.from) : [])];
}
