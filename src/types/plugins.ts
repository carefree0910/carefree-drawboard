import type { FlexProps } from "@chakra-ui/react";

import type { NodeType, PivotType } from "@noli/core";
import type { IResponse } from "@noli/business";

import type { TaskTypes } from "./tasks";
import type { ICustomDefinitions, ISubscribableFields } from "./metaFields";

// general

export type NodeConstraints = NodeType | "none" | "anyNode" | "singleNode" | "multiNode";
export interface IPositionInfo extends FlexProps {
  w: number;
  h: number;
  iconW: number;
  iconH: number;
  pivot: PivotType;
  follow: boolean;
  expandOffsetX: number;
  expandOffsetY: number;
}
export interface IFloating extends IPositionInfo {
  id: string;
  src?: string;
  renderFilter?: (info?: IResponse) => boolean;
}
export interface IRender
  extends Omit<
    IFloating,
    "id" | "pivot" | "follow" | "iconW" | "iconH" | "expandOffsetX" | "expandOffsetY"
  > {
  nodeConstraint: NodeConstraints;
  pivot?: PivotType;
  follow?: boolean;
  offsetX?: number;
  offsetY?: number;
  iconW?: number;
  iconH?: number;
  expandOffsetX?: number;
  expandOffsetY?: number;
}

// specific

export interface ITaskPlugin extends IRender {
  task: TaskTypes;
  fields: ISubscribableFields[];
  customDefinitions?: ICustomDefinitions;
}
