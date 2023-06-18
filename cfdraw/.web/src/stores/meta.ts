import { makeObservable, observable, runInAction } from "mobx";

import { ISingleNode, Logger, Matrix2DFields } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { INodeData } from "@/schema/_python";
import type { ICommonMetaData, IMeta } from "@/schema/meta";
import type { IListProperties } from "@/schema/plugins";
import { getNodeData } from "@/hooks/usePython";

class MetaStore extends ABCStore<IMeta["data"]> {
  data: IMeta["data"] = {};

  constructor() {
    super();
    makeObservable(this, {
      data: observable,
    });
  }

  get info(): IMeta["data"] {
    return this.data;
  }
}

const metaStore = new MetaStore();
type IMetaKey = keyof ICommonMetaData;
type IGeneralKey = string;
interface IGetMetaField<T extends IMetaKey | IGeneralKey> {
  field: T;
  listProperties?: IListProperties;
}
export function getMetaField<T extends IMetaKey>(fieldKeys: IGetMetaField<T>): ICommonMetaData[T];
export function getMetaField<T extends IGeneralKey>(fieldKeys: IGetMetaField<T>): any;
export function getMetaField<T extends IMetaKey | IGeneralKey>({
  field,
  listProperties,
}: IGetMetaField<T>): any {
  if (!listProperties) return metaStore.data[field];
  const list = metaStore.data[listProperties.listKey] as any[];
  if (list.length <= listProperties.listIndex) return;
  return list[listProperties.listIndex][field];
}
interface ISetMetaField<T extends IMetaKey | IGeneralKey> {
  field: T;
  listProperties?: IListProperties;
}
export function setMetaField<T extends IMetaKey>(
  fieldKeys: ISetMetaField<T>,
  value: ICommonMetaData[T],
): void;
export function setMetaField<T extends IGeneralKey>(fieldKeys: ISetMetaField<T>, value: any): void;
export function setMetaField<T extends IMetaKey | IGeneralKey>(
  { field, listProperties }: ISetMetaField<T>,
  value: any,
): void {
  if (!listProperties) {
    metaStore.updateProperty(field, value);
  } else {
    const list = metaStore.data[listProperties.listKey] as any[];
    if (list.length <= listProperties.listIndex) {
      Logger.warn(`list index ${listProperties.listIndex} out of range`);
    } else {
      runInAction(() => (list[listProperties.listIndex][field] = value));
    }
  }
}

export interface IMetaInjection {
  node: INodeData;
  bboxFields?: Matrix2DFields;
}
export type IMetaInjections = Partial<Record<IMetaKey | IGeneralKey, IMetaInjection>>;
class MetaInjectionsStore extends ABCStore<IMetaInjections> {
  injections: IMetaInjections = {};

  constructor() {
    super();
    makeObservable(this, {
      injections: observable,
    });
  }

  get info(): IMetaInjections {
    return this.injections;
  }
}

export const metaInjectionsStore = new MetaInjectionsStore();
export function getListInjectionKey({ field, listProperties }: ISetMetaField<string>) {
  if (!listProperties) return field;
  return `${listProperties.listKey}.${listProperties.listIndex}.${field}`;
}
export function makeMetaInjectionFrom(node: ISingleNode): Promise<IMetaInjection> {
  return getNodeData(node, {}).then((nodeData) => ({
    node: nodeData,
    bboxFields: node.bboxFields,
  }));
}
export function getMetaInjection(key: string): IMetaInjection | undefined {
  return metaInjectionsStore.injections[key];
}
// injection: undefined means remove the corresponding injection
export function setMetaInjection<T extends IMetaKey>(
  fieldKeys: ISetMetaField<T>,
  injection: IMetaInjection | undefined,
): void;
export function setMetaInjection<T extends IGeneralKey>(
  fieldKeys: ISetMetaField<T>,
  injection: IMetaInjection | undefined,
): void;
export function setMetaInjection<T extends IMetaKey | IGeneralKey>(
  fieldKeys: ISetMetaField<T>,
  injection: IMetaInjection | undefined,
): void {
  metaInjectionsStore.updateProperty(getListInjectionKey(fieldKeys), injection);
}
