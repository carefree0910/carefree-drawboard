import type { ReactElement } from "react";

import type { Dictionary } from "@carefree0910/core";

interface IBaseFields {
  props?: any;
  numRows?: number;
}
export interface ITextField extends IBaseFields {
  type: "text";
  default: string;
  placeholder?: string;
}
export interface IImageField extends IBaseFields {
  type: "image";
  default: string;
}
export interface INumberField extends IBaseFields {
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
export interface ISelectField<T> extends IBaseFields {
  type: "select";
  values: readonly T[];
  default: T;
  isMulti?: boolean;
}
export interface IBooleanField extends IBaseFields {
  type: "boolean";
  default: boolean;
}
export interface IColorField extends IBaseFields {
  type: "color";
  default: string;
}
export interface IListField extends IBaseFields {
  type: "list";
  item: IFieldDefinition;
  default: any[];
}
export interface IObjectField extends IBaseFields {
  type: "object";
  items: IDefinitions;
  default: Dictionary<any>;
}

export type IFieldDefinition =
  | ITextField
  | IImageField
  | INumberField
  | ISelectField<any>
  | IBooleanField
  | IColorField
  | IListField
  | IObjectField;
export type IFieldType = IFieldDefinition["type"];
export type IDefinitions = Dictionary<IFieldDefinition>;
