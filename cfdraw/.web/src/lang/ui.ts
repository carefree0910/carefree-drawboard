import type { Lang } from "@carefree0910/core";

export enum UI_Words {
  "submit-task" = "submit-task",
  "qa-field-placeholder" = "qa-field-placeholder",
  "chat-field-placeholder" = "chat-field-placeholder",
  "task-pending-caption" = "task-pending-caption",
  "task-working-caption" = "task-working-caption",
}

export const uiLangRecords: Record<Lang, Record<UI_Words, string>> = {
  zh: {
    [UI_Words["submit-task"]]: "提交",
    [UI_Words["qa-field-placeholder"]]: "请输入您的问题",
    [UI_Words["chat-field-placeholder"]]: "请输入",
    [UI_Words["task-pending-caption"]]: "排队中",
    [UI_Words["task-working-caption"]]: "执行中",
  },
  en: {
    [UI_Words["submit-task"]]: "Submit",
    [UI_Words["qa-field-placeholder"]]: "Input your question",
    [UI_Words["chat-field-placeholder"]]: "Send a message.",
    [UI_Words["task-pending-caption"]]: "Pending",
    [UI_Words["task-working-caption"]]: "Working",
  },
};
