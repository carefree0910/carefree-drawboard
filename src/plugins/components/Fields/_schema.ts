import type { IFieldDefinition, IGeneralFields } from "@/types/metaFields";

export interface IField<T extends IFieldDefinition> {
  field: IGeneralFields;
  definition: T;
}
