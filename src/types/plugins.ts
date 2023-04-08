import type { FlexProps } from "@chakra-ui/react";

import type { INode, NodeType, PivotType } from "@noli/core";
import type { IResponse } from "@noli/business";

import type { TaskTypes } from "./tasks";
import type { ICustomDefinitions, ISubscribableFields } from "./metaFields";

// general

export type NodeConstraints = NodeType | "none" | "anyNode" | "singleNode" | "multiNode";
export interface IPositionInfo {
  w: number;
  h: number;
  iconW: number;
  iconH: number;
  pivot: PivotType;
  follow: boolean;
  expandOffsetX: number;
  expandOffsetY: number;
}
export interface IRenderInfo extends IPositionInfo {
  src?: string;
  bgOpacity?: number;
  renderFilter?: (info?: IResponse) => boolean;
  useModal?: boolean;
  modalOpacity?: number;
  isInvisible?: boolean;
}
export interface IFloating extends FlexProps {
  id: string;
  renderInfo: IRenderInfo;
}
export interface IRender extends Omit<IFloating, "id" | "renderInfo"> {
  offsetX?: number;
  offsetY?: number;
  nodeConstraint: NodeConstraints;
  renderInfo: Partial<IRenderInfo> & { w: number; h: number };
  pluginInfo?: {};
}

export interface IPlugin extends IRender {
  pluginInfo: { node: INode | null };
}

// specific

export interface ITaskPlugin extends IPlugin {
  pluginInfo: IPlugin["pluginInfo"] & {
    fields: ISubscribableFields[];
    customDefinitions?: ICustomDefinitions;
  };
}

export interface IInternalTaskPlugin extends ITaskPlugin {
  pluginInfo: ITaskPlugin["pluginInfo"] & { task: TaskTypes };
}

// python

export interface IPythonPlugin extends IPlugin {
  pluginInfo: IPlugin["pluginInfo"] & {
    endpoint: string;
    identifier: string;
    updateInterval?: number;
  };
}

// factory

export const allAvailablePlugins = ["meta", "txt2img.sd", "settings"] as const;
export const allAvailablePythonPlugins = ["_python.textArea"] as const;
export type AvailablePlugins = typeof allAvailablePlugins[number];
export type AvailablePythonPlugins = typeof allAvailablePythonPlugins[number];
export type AvailablePluginsAndPythonPlugins = AvailablePlugins | AvailablePythonPlugins;

export interface IPluginProps {
  meta: IPlugin;
  "txt2img.sd": ITaskPlugin;
  settings: IPlugin;
}
export interface IPythonPluginProps {
  "_python.textArea": IPythonPlugin;
}
