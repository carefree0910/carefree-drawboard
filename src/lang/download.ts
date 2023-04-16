import { Lang } from "@carefree0910/core";

export enum Download_Words {
  "download-plugin-header" = "download-plugin-header",
  "download-button" = "download-button",
  "download-image-size-original" = "download-image-size-original",
  "download-image-size-drawboard" = "download-image-size-drawboard",
  "download-multiple-caption" = "download-multiple-caption",
}

export const downloadLangRecords: Record<Lang, Record<Download_Words, string>> = {
  zh: {
    [Download_Words["download-plugin-header"]]: "下载",
    [Download_Words["download-button"]]: "下 载",
    [Download_Words["download-image-size-original"]]: "原始尺寸",
    [Download_Words["download-image-size-drawboard"]]: "画板尺寸",
    [Download_Words["download-multiple-caption"]]: "下载多节点",
  },
  en: {
    [Download_Words["download-plugin-header"]]: "Download",
    [Download_Words["download-button"]]: "Download",
    [Download_Words["download-image-size-original"]]: "Original Size",
    [Download_Words["download-image-size-drawboard"]]: "Drawboard Size",
    [Download_Words["download-multiple-caption"]]: "Multiple",
  },
};
