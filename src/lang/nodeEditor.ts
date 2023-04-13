import { Lang } from "@noli/core";

export enum NodeEditor_Words {
  "text-editor-plugin-header" = "text-editor-plugin-header",
}

export const nodeEditorLangRecords: Record<Lang, Record<NodeEditor_Words, string>> = {
  zh: {
    [NodeEditor_Words["text-editor-plugin-header"]]: "编辑文本",
  },
  en: {
    [NodeEditor_Words["text-editor-plugin-header"]]: "Edit Text",
  },
};
