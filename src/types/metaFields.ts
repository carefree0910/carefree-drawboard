import type { ReactElement } from "react";

import type { Dictionary } from "@noli/core";

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
}
export interface ITextField {
  type: "text";
  placeholder?: string;
}
export interface IBooleanField {
  type: "boolean";
  default: boolean;
}
export interface IListField {
  type: "list";
  item: Dictionary<IFieldDefinition>;
}
export interface IObjectField {
  type: "object";
  item: Dictionary<IFieldDefinition>;
}
export interface IImageField {
  type: "image";
}

export type _IFieldDefinition =
  | INumberField
  | ISelectField<any>
  | ITextField
  | IBooleanField
  | IListField
  | IObjectField
  | IImageField;
export type IFieldDefinition<T extends _IFieldDefinition = _IFieldDefinition> = T & { props?: any };
export type IDefinitions = Dictionary<IFieldDefinition>;
