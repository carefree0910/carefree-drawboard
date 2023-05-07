import type { Dictionary } from "@carefree0910/core";

import type { IStr } from "./misc";

interface IBaseFields {
  label?: IStr;
  tooltip?: IStr;
  props?: any;
  numRows?: number;
}
export interface ITextField extends IBaseFields {
  type: "text";
  default: IStr;
  // if `numberOptions` is provided, this field will be parsed to number.
  numberOptions?: {
    min?: number;
    max?: number;
    isInt?: boolean;
  };
}
export interface IImageField extends IBaseFields {
  type: "image";
  default: IStr;
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
  precision?: number;
}
interface ISelectLocalProperties {
  path: string;
  regex?: string;
  noExt: boolean;
  onlyFiles: boolean;
}
export interface ISelectField<T> extends IBaseFields {
  type: "select";
  values: readonly T[];
  default: T;
  isMulti?: boolean;
  localProperties?: ISelectLocalProperties;
}
export interface IBooleanField extends IBaseFields {
  type: "boolean";
  default: boolean;
}
export interface IColorField extends IBaseFields {
  type: "color";
  default: IStr;
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
