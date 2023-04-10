import type { IFieldDefinition, ISubscribableFields } from "@/types/metaFields";

export interface IField<T extends IFieldDefinition> {
  field: ISubscribableFields | string;
  definition: T;
}
