import type { RefObject } from "react";
import type { ButtonProps, FlexProps } from "@chakra-ui/react";

import type { INode, NodeType, PivotType, IFieldDefinition } from "@carefree0910/core";

import type { IStr } from "./misc";
import type {
  IPythonChatPlugin,
  IPythonFieldsPlugin,
  IPythonPlugin,
  IPythonPluginGroup,
  IPythonQAPlugin,
  IPythonTextAreaPlugin,
  IPythonWorkflowPlugin,
} from "./_python";

// general

type NodeConstraints = NodeType | "none" | "anyNode" | "singleNode" | "multiNode";
interface NodeConstraintRules {
  some?: NodeConstraints[];
  every?: NodeConstraints[];
  exactly?: NodeConstraints[];
}
export interface NodeConstraintSettings {
  nodeConstraint?: NodeConstraints;
  nodeConstraintRules?: NodeConstraintRules;
  nodeConstraintValidator?: string;
}
export interface IExpandPositionInfo {
  w: number;
  h: number;
  iconW: number;
  iconH: number;
  expandPivot: PivotType;
  follow: boolean;
  expandOffsetX: number;
  expandOffsetY: number;
}
export interface IRenderInfo extends IExpandPositionInfo {
  src: IStr;
  pivot: PivotType;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  tooltip?: IStr;
  offsetX?: number;
  offsetY?: number;
  bgOpacity?: number;
  useModal?: boolean;
  keepOpen?: boolean;
  expandOpacity?: number;
  expandProps?: FlexProps;
  isInvisible?: boolean;
}
export interface IFloating extends ButtonProps {
  id: string;
  groupId?: string; // the id of the group this floating belongs to
  renderInfo: IRenderInfo;
  noExpand?: boolean;
  onFloatingButtonClick?: () => Promise<void>;
}
export interface IRender extends Omit<IFloating, "id" | "renderInfo">, NodeConstraintSettings {
  id?: string;
  isGroup?: boolean;
  renderInfo: Partial<Omit<IRenderInfo, "src">> & { w: number; h: number; src: IStr };
  containerRef?: RefObject<HTMLDivElement>;
}
export interface IPluginInfo {
  node: INode | null;
  nodes: INode[];
}
export interface IPlugin extends IRender {
  pluginInfo: IPluginInfo;
}
export interface ILogoPlugin extends IPlugin {
  pluginInfo: IPluginInfo & { redirectUrl?: string };
}

// specific

export interface IListProperties {
  listKey: string;
  listIndex: number;
}
export interface IField<T extends IFieldDefinition> {
  field: string;
  definition: T;
  onFieldChange?: (value: any) => void;
  onFieldChangeComplete?: (value: any) => void;
  listProperties?: IListProperties;
}

// factory

export const allReactPlugins = [
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
  "email",
  "github",
  "shortcuts",
  "logo",
  "basicEditor",
  "textEditor",
  "imageEditor",
  "svgEditor",
  "noliFrameEditor",
  "noliTextFrameEditor",
  "groupEditor",
  "multiEditor",
  "brush",
] as const;
export const allPythonPlugins = [
  "_python.pluginGroup",
  "_python.fields",
  "_python.workflow",
  "_python.textArea",
  "_python.QA",
  "_python.chat",
  "_python.markdown",
] as const;
export type ReactPlugins = (typeof allReactPlugins)[number];
export type PythonPlugins = (typeof allPythonPlugins)[number];
export type AllPlugins = ReactPlugins | PythonPlugins;

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
  email: IPlugin;
  github: IPlugin;
  shortcuts: IPlugin;
  logo: ILogoPlugin;
  basicEditor: IPlugin;
  textEditor: IPlugin;
  imageEditor: IPlugin;
  svgEditor: IPlugin;
  noliFrameEditor: IPlugin;
  noliTextFrameEditor: IPlugin;
  groupEditor: IPlugin;
  multiEditor: IPlugin;
  brush: IPlugin;
  // python plugins
  "_python.pluginGroup": IPythonPluginGroup;
  "_python.fields": IPythonFieldsPlugin;
  "_python.workflow": IPythonWorkflowPlugin;
  "_python.textArea": IPythonTextAreaPlugin;
  "_python.QA": IPythonQAPlugin;
  "_python.chat": IPythonChatPlugin;
  "_python.markdown": IPythonPlugin;
}

export interface IMakePlugin<T extends AllPlugins> {
  type: T;
  props: Omit<IPluginProps[T], "containerRef" | "pluginInfo"> & {
    pluginInfo: Omit<IPluginProps[T]["pluginInfo"], "node" | "nodes">;
  };
  containerRef?: RefObject<HTMLDivElement>;
}
