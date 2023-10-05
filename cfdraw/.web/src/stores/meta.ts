import { makeObservable, observable } from "mobx";

import { Dictionary, Matrix2DFields, IDataCenterKey } from "@carefree0910/core";
import { ABCStore } from "@carefree0910/business";
import { INodeData } from "@carefree0910/components";

export interface IMetaInjection {
  node: INodeData;
  bboxFields?: Matrix2DFields;
}
export type IMetaInjections = Dictionary<IMetaInjection>;
class MetaInjectionsStore extends ABCStore<Dictionary<any>> {
  injections: Dictionary<any> = {};

  constructor() {
    super();
    makeObservable(this, {
      injections: observable,
    });
  }

  get info(): Dictionary<any> {
    return this.injections;
  }
}

const metaInjectionsStore = new MetaInjectionsStore();
export function getListInjectionKey({ field, listProperties }: IDataCenterKey) {
  if (!listProperties) return field;
  return `${listProperties.listKey}.${listProperties.listIndex}.${field}`;
}
export function getMetaInjection(key: string): IMetaInjection | undefined {
  return metaInjectionsStore.injections[key];
}
// injection: undefined means remove the corresponding injection
export function setMetaInjection(
  fieldKeys: IDataCenterKey,
  injection: IMetaInjection | undefined,
): void {
  metaInjectionsStore.updateProperty(getListInjectionKey(fieldKeys), injection);
}
