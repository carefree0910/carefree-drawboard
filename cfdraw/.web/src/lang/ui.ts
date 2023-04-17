import type { Lang } from "@carefree0910/core";

export enum UI_Words {
  "submit-task" = "submit-task",
  "w-field-label" = "w-field-label",
  "h-field-label" = "h-field-label",
  "prompt-field-placeholder" = "prompt-field-placeholder",
  "negative_prompt-field-placeholder" = "negative_prompt-field-placeholder",
  "num_steps-field-label" = "num_steps-field-label",
  "guidance_scale-field-label" = "guidance_scale-field-label",
  "qa-field-placeholder" = "qa-field-placeholder",
}

export const uiLangRecords: Record<Lang, Record<UI_Words, string>> = {
  zh: {
    [UI_Words["submit-task"]]: "提交",
    [UI_Words["w-field-label"]]: "宽度",
    [UI_Words["h-field-label"]]: "高度",
    [UI_Words["prompt-field-placeholder"]]: "提示词",
    [UI_Words["negative_prompt-field-placeholder"]]: "负面词",
    [UI_Words["num_steps-field-label"]]: "采样步数",
    [UI_Words["guidance_scale-field-label"]]: "引导强度",
    [UI_Words["qa-field-placeholder"]]: "请输入您的问题",
  },
  en: {
    [UI_Words["submit-task"]]: "Submit",
    [UI_Words["w-field-label"]]: "Width",
    [UI_Words["h-field-label"]]: "Height",
    [UI_Words["prompt-field-placeholder"]]: "Prompt",
    [UI_Words["negative_prompt-field-placeholder"]]: "Negative Prompt",
    [UI_Words["num_steps-field-label"]]: "Steps",
    [UI_Words["guidance_scale-field-label"]]: "Cfg",
    [UI_Words["qa-field-placeholder"]]: "Input your question",
  },
};
