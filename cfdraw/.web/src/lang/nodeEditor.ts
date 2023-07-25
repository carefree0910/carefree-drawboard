import { Lang } from "@carefree0910/core";

export enum NodeEditor_Words {
  "basic-editor-plugin-header" = "basic-editor-plugin-header",
  "text-editor-plugin-header" = "text-editor-plugin-header",
  "image-editor-plugin-header" = "image-editor-plugin-header",
  "svg-editor-plugin-header" = "svg-editor-plugin-header",
  "noliFrame-editor-plugin-header" = "noliFrame-editor-plugin-header",
  "noliTextFrame-editor-plugin-header" = "noliTextFrame-editor-plugin-header",
}

export const nodeEditorLangRecords: Record<Lang, Record<NodeEditor_Words, string>> = {
  zh: {
    [NodeEditor_Words["basic-editor-plugin-header"]]: "基础属性",
    [NodeEditor_Words["text-editor-plugin-header"]]: "编辑文本",
    [NodeEditor_Words["image-editor-plugin-header"]]: "编辑图片",
    [NodeEditor_Words["svg-editor-plugin-header"]]: "编辑 SVG",
    [NodeEditor_Words["noliFrame-editor-plugin-header"]]: "编辑艺术字",
    [NodeEditor_Words["noliTextFrame-editor-plugin-header"]]: "编辑复杂文本",
  },
  en: {
    [NodeEditor_Words["basic-editor-plugin-header"]]: "Basic Fields",
    [NodeEditor_Words["text-editor-plugin-header"]]: "Edit Text",
    [NodeEditor_Words["image-editor-plugin-header"]]: "Edit Image",
    [NodeEditor_Words["svg-editor-plugin-header"]]: "Edit SVG",
    [NodeEditor_Words["noliFrame-editor-plugin-header"]]: "Edit Art Text",
    [NodeEditor_Words["noliTextFrame-editor-plugin-header"]]: "Edit Advanced Text",
  },
};
