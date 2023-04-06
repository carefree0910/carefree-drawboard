import { shallowCopy } from "@noli/core";

import {
  defaultFieldDefinitions,
  ICustomDefinitions,
  IFieldDefinitions,
  ISubscribableFields,
} from "@/types/metaFields";

export function subscribe(
  fields: ISubscribableFields[],
  customDefinitions?: ICustomDefinitions,
): Partial<IFieldDefinitions> {
  customDefinitions ??= {};
  const result: Partial<IFieldDefinitions> = {};
  for (const field of fields) {
    result[field] = {
      ...shallowCopy(defaultFieldDefinitions[field]),
      ...shallowCopy(customDefinitions[field] ?? {}),
    };
  }
  return result;
}
