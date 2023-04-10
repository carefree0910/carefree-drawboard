import { Dictionary, shallowCopy } from "@noli/core";

import {
  defaultFieldDefinitions,
  ICustomDefinitions,
  IFieldDefinition,
  ISubscribableFields,
} from "@/types/metaFields";

export function subscribe(
  fields: ISubscribableFields[],
  customDefinitions?: ICustomDefinitions,
): Dictionary<IFieldDefinition> {
  customDefinitions ??= {};
  const result = shallowCopy(customDefinitions ?? {});
  for (const field of fields) {
    result[field] = shallowCopy(defaultFieldDefinitions[field]);
  }
  return result;
}
