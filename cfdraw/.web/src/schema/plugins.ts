import type { RefObject } from "react";
import type { FlexProps } from "@chakra-ui/react";

import type { INode, NodeType, PivotType } from "@carefree0910/core";
import type { IResponse } from "@carefree0910/business";

import type { IFieldDefinition } from "./fields";
import type {
  IPythonFieldsPlugin,
  IPythonPluginGroup,
  IPythonQAPlugin,
  IPythonTextAreaPlugin,
} from "./_python";

// general

export type NodeConstraints = NodeType | "none" | "anyNode" | "singleNode" | "multiNode";
export interface IExpandPositionInfo {
  w: number;
  h: number;
  iconW: number;
  iconH: number;
  pivot: PivotType;
  follow: boolean;
  expandOffsetX: number;
  expandOffsetY: number;
}
export interface IRenderInfo extends IExpandPositionInfo {
  src?: string;
  tooltip?: string;
  offsetX?: number;
  offsetY?: number;
  bgOpacity?: number;
  renderFilter?: (info?: IResponse) => boolean;
  useModal?: boolean;
  modalOpacity?: number;
  expandProps?: FlexProps;
  isInvisible?: boolean;
}
export interface IFloating extends FlexProps {
  id: string;
  isGroup?: boolean;
  groupId?: string; // the id of the group this floating belongs to
  renderInfo: IRenderInfo;
  noExpand?: boolean;
  onFloatingButtonClick?: () => Promise<void>;
}
export interface IRender extends Omit<IFloating, "id" | "renderInfo"> {
  id?: string;
  nodeConstraint: NodeConstraints;
  renderInfo: Partial<IRenderInfo> & { w: number; h: number };
  containerRef?: RefObject<HTMLDivElement>;
}
export interface IPluginInfo {
  node: INode | null;
  nodes: INode[];
}
export interface IPlugin extends IRender {
  pluginInfo: IPluginInfo;
}

// specific

export interface IField<T extends IFieldDefinition> {
  field: string;
  definition: T;
}

// factory

export const allAvailablePlugins = [
  "meta",
  "settings",
  "project",
  "add",
  "arrange",
  "undo",
  "redo",
  "download",
  "delete",
  "wiki",
  "github",
  "email",
  "textEditor",
  "groupEditor",
  "multiEditor",
  "brush",
] as const;
export const allAvailablePythonPlugins = [
  "_python.textArea",
  "_python.QA",
  "_python.fields",
  "_python.pluginGroup",
] as const;
export type AvailablePlugins = (typeof allAvailablePlugins)[number];
export type AvailablePythonPlugins = (typeof allAvailablePythonPlugins)[number];
export type AvailablePluginsAndPythonPlugins = AvailablePlugins | AvailablePythonPlugins;

export interface IPluginProps {
  // react plugins
  meta: IPlugin;
  settings: IPlugin;
  project: IPlugin;
  add: IPlugin;
  arrange: IPlugin;
  undo: IPlugin;
  redo: IPlugin;
  download: IPlugin;
  delete: IPlugin;
  wiki: IPlugin;
  github: IPlugin;
  email: IPlugin;
  textEditor: IPlugin;
  groupEditor: IPlugin;
  multiEditor: IPlugin;
  brush: IPlugin;
  // python plugins
  "_python.textArea": IPythonTextAreaPlugin;
  "_python.QA": IPythonQAPlugin;
  "_python.fields": IPythonFieldsPlugin;
  "_python.pluginGroup": IPythonPluginGroup;
}

export interface IMakePlugin<T extends AvailablePluginsAndPythonPlugins> {
  type: T;
  props: Omit<IPluginProps[T], "containerRef" | "pluginInfo"> & {
    pluginInfo: Omit<IPluginProps[T]["pluginInfo"], "node" | "nodes">;
  };
  containerRef?: RefObject<HTMLDivElement>;
}
