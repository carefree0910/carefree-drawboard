import type { RefObject } from "react";
import type { FlexProps } from "@chakra-ui/react";

import type { INode, NodeType, PivotType } from "@noli/core";
import type { IResponse } from "@noli/business";

import type { TaskTypes } from "./tasks";
import type {
  ICustomDefinitions,
  IFieldDefinition,
  IGeneralFields,
  ISubscribableFields,
  _IFieldDefinition,
} from "./metaFields";
import type {
  IPythonHttpFieldsPlugin,
  IPythonHttpQAPlugin,
  IPythonHttpTextAreaPlugin,
} from "./_python";

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
  expandProps?: FlexProps;
  isInvisible?: boolean;
}
export interface IFloating extends FlexProps {
  id: string;
  renderInfo: IRenderInfo;
  noExpand?: boolean;
  onFloatingButtonClick?: () => Promise<void>;
}
export interface IRender extends Omit<IFloating, "id" | "renderInfo"> {
  id?: string;
  offsetX?: number;
  offsetY?: number;
  nodeConstraint: NodeConstraints;
  renderInfo: Partial<IRenderInfo> & { w: number; h: number };
  containerRef?: RefObject<HTMLDivElement>;
}
export interface IPlugin extends IRender {
  pluginInfo: { node: INode | null; nodes: INode[] };
}

// specific

export interface IField<T extends _IFieldDefinition> {
  field: IGeneralFields;
  definition: IFieldDefinition<T>;
}
export interface IFieldsPlugin extends IPlugin {
  pluginInfo: IPlugin["pluginInfo"] & {
    fields: ISubscribableFields[];
    customDefinitions?: ICustomDefinitions;
    numColumns?: number;
  };
}
export interface ITaskPlugin extends IFieldsPlugin {
  pluginInfo: IFieldsPlugin["pluginInfo"] & { task: TaskTypes };
}

// factory

export const allAvailablePlugins = [
  "txt2img.sd",
  "settings",
  "project",
  "add",
  "arrange",
  "undo",
  "redo",
] as const;
export const allAvailablePythonPlugins = [
  "_python.httpTextArea",
  "_python.httpQA",
  "_python.httpFields",
] as const;
export type AvailablePlugins = typeof allAvailablePlugins[number];
export type AvailablePythonPlugins = typeof allAvailablePythonPlugins[number];
export type AvailablePluginsAndPythonPlugins = AvailablePlugins | AvailablePythonPlugins;

export interface IPluginProps {
  // react plugins
  meta: IPlugin;
  "txt2img.sd": IFieldsPlugin;
  settings: IPlugin;
  project: IPlugin;
  add: IPlugin;
  arrange: IPlugin;
  undo: IPlugin;
  redo: IPlugin;
  // python plugins
  "_python.httpTextArea": IPythonHttpTextAreaPlugin;
  "_python.httpQA": IPythonHttpQAPlugin;
  "_python.httpFields": IPythonHttpFieldsPlugin;
}

export interface IMakePlugin<T extends AvailablePluginsAndPythonPlugins> {
  type: T;
  props: Omit<IPluginProps[T], "containerRef" | "pluginInfo"> & {
    pluginInfo: Omit<IPluginProps[T]["pluginInfo"], "node" | "nodes">;
  };
  containerRef?: RefObject<HTMLDivElement>;
}
