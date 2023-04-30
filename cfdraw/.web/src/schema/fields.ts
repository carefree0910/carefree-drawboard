import type { ReactElement } from "react";

import type { Dictionary } from "@carefree0910/core";

export interface ITextField {
  type: "text";
  default: string;
  placeholder?: string;
}
export interface IImageField {
  type: "image";
  default: string;
}
export interface INumberField {
  type: "number";
  default: number;
  min?: number;
  max?: number;
  // slider
  step?: number;
  isInt?: boolean;
  scale?: "linear" | "logarithmic";
  label?: string | ReactElement;
  precision?: number;
}
export interface ISelectField<T> {
  type: "select";
  values: readonly T[];
  default: T;
  isMulti?: boolean;
}
export interface IBooleanField {
  type: "boolean";
  default: boolean;
}
export interface IColorField {
  type: "color";
  default: string;
}
export interface IListField {
  type: "list";
  item: IFieldDefinition;
  default: any[];
}
export interface IObjectField {
  type: "object";
  items: IDefinitions;
  default: Dictionary<any>;
}

export type _IFieldDefinition =
  | ITextField
  | IImageField
  | INumberField
  | ISelectField<any>
  | IBooleanField
  | IColorField
  | IListField
  | IObjectField;
export type IFieldType = _IFieldDefinition["type"];
export type IFieldDefinition<T extends _IFieldDefinition = _IFieldDefinition> = T & { props?: any };
export type IDefinitions = Dictionary<IFieldDefinition>;
