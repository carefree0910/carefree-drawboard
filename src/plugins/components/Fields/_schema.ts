import type { IFieldDefinition, IGeneralFields, _IFieldDefinition } from "@/types/metaFields";

export interface IField<T extends _IFieldDefinition> {
  field: IGeneralFields;
  definition: IFieldDefinition<T>;
}
