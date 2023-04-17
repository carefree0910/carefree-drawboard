import { Lang } from "@carefree0910/core";

export enum Brush_Words {
  "brush-plugin-header" = "brush-plugin-header",
  "brush-width-label" = "brush-width-label",
  "brush-use-fill-label" = "brush-use-fill-label",
  "finish-brush-message" = "finish-brush-message",
}

export const brushLangRecords: Record<Lang, Record<Brush_Words, string>> = {
  zh: {
    [Brush_Words["brush-plugin-header"]]: "涂鸦设置",
    [Brush_Words["brush-width-label"]]: "粗细",
    [Brush_Words["brush-use-fill-label"]]: "使用填充",
    [Brush_Words["finish-brush-message"]]: "完成涂鸦",
  },
  en: {
    [Brush_Words["brush-plugin-header"]]: "Sketch Settings",
    [Brush_Words["brush-width-label"]]: "Width",
    [Brush_Words["brush-use-fill-label"]]: "Use Fill",
    [Brush_Words["finish-brush-message"]]: "Finish Sketch",
  },
};
