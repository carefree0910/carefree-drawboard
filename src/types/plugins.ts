import type { FlexProps } from "@chakra-ui/react";

import type { INode, NodeType, PivotType } from "@noli/core";
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
  useModal?: boolean;
  modalOpacity?: number;
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

export interface IPlugin extends IRender {
  node: INode | null;
}

// specific

export interface ITaskPlugin extends IPlugin {
  task: TaskTypes;
  fields: ISubscribableFields[];
  customDefinitions?: ICustomDefinitions;
}

// factory

export const allAvailablePlugins = ["task", "meta"] as const;
export type AvailablePlugins = typeof allAvailablePlugins[number];

export interface IPluginProps {
  task: ITaskPlugin;
  meta: IPlugin;
}
