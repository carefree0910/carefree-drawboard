import { makeObservable, observable, runInAction } from "mobx";

import { Dictionary, Logger } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";

import type { IListProperties } from "@/schema/plugins";

class DataCenter extends ABCStore<Dictionary<any>> {
  data: Dictionary<any> = {};

  constructor() {
    super();
    makeObservable(this, {
      data: observable,
    });
  }

  get info(): Dictionary<any> {
    return this.data;
  }
}

const dataCenter = new DataCenter();

export interface IDataCenterKey {
  field: string;
  listProperties?: IListProperties;
}
export function getFieldData({ field, listProperties }: IDataCenterKey): any {
  if (!listProperties) return dataCenter.data[field];
  const list = dataCenter.data[listProperties.listKey] as any[];
  if (list.length <= listProperties.listIndex) return;
  return list[listProperties.listIndex][field];
}
export function setFieldData({ field, listProperties }: IDataCenterKey, value: any): void {
  if (!listProperties) {
    dataCenter.updateProperty(field, value);
  } else {
    const list = dataCenter.data[listProperties.listKey] as any[];
    if (list.length <= listProperties.listIndex) {
      Logger.warn(`list index ${listProperties.listIndex} out of range`);
    } else {
      runInAction(() => (list[listProperties.listIndex][field] = value));
    }
  }
}
