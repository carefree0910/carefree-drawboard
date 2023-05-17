import { makeObservable, observable, runInAction } from "mobx";

import { Logger } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { ICommonMetaData, IMeta } from "@/schema/meta";
import type { IListProperties } from "@/schema/plugins";

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
  if (list.length <= listProperties.listIndex) return undefined;
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
