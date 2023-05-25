import { Lang } from "@carefree0910/core";

export enum NodeEditor_Words {
  "basic-editor-plugin-header" = "basic-editor-plugin-header",
  "text-editor-plugin-header" = "text-editor-plugin-header",
}

export const nodeEditorLangRecords: Record<Lang, Record<NodeEditor_Words, string>> = {
  zh: {
    [NodeEditor_Words["basic-editor-plugin-header"]]: "基础属性",
    [NodeEditor_Words["text-editor-plugin-header"]]: "编辑文本",
  },
  en: {
    [NodeEditor_Words["basic-editor-plugin-header"]]: "Basic Fields",
    [NodeEditor_Words["text-editor-plugin-header"]]: "Edit Text",
  },
};
