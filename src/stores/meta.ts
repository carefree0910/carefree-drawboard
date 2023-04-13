import { makeObservable, observable } from "mobx";

import { ABCStore } from "@noli/business";

import type { ICommonMetaData, IMeta } from "@/types/meta";

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
export function getMetaField<T extends IMetaKey>(field: T): ICommonMetaData[T];
export function getMetaField<T extends IGeneralKey>(field: T): any;
export function getMetaField<T extends IMetaKey | IGeneralKey>(field: T): any {
  return metaStore.data[field];
}
export function setMetaField<T extends IMetaKey>(field: T, value: ICommonMetaData[T]): void;
export function setMetaField<T extends IGeneralKey>(field: T, value: any): void;
export function setMetaField<T extends IMetaKey | IGeneralKey>(field: T, value: any): void {
  metaStore.updateProperty(field, value);
}
