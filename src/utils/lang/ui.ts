import type { Lang } from "@noli/core";

export enum UI_Words {
  "submit-task" = "submit-task",
  "prompt-field-placeholder" = "prompt-field-placeholder",
  "qa-field-placeholder" = "qa-field-placeholder",
}

export const uiLangRecords: Record<Lang, Record<UI_Words, string>> = {
  zh: {
    [UI_Words["submit-task"]]: "提交",
    [UI_Words["prompt-field-placeholder"]]: "提示词",
    [UI_Words["qa-field-placeholder"]]: "请输入您的问题",
  },
  en: {
    [UI_Words["submit-task"]]: "Submit",
    [UI_Words["prompt-field-placeholder"]]: "Prompt",
    [UI_Words["qa-field-placeholder"]]: "Input your question",
  },
};
