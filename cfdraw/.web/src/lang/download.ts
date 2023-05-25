import { Lang } from "@carefree0910/core";

export enum Download_Words {
  "download-plugin-header" = "download-plugin-header",
  "download-button" = "download-button",
  "download-original-image" = "download-original-image",
  "download-drawboard-image" = "download-drawboard-image",
  "download-original-image-tooltip" = "download-original-image-tooltip",
  "download-drawboard-image-tooltip" = "download-drawboard-image-tooltip",
  "download-multiple-caption" = "download-multiple-caption",
}

export const downloadLangRecords: Record<Lang, Record<Download_Words, string>> = {
  zh: {
    [Download_Words["download-plugin-header"]]: "下载",
    [Download_Words["download-button"]]: "下 载",
    [Download_Words["download-original-image"]]: "原图",
    [Download_Words["download-drawboard-image"]]: "画板图",
    [Download_Words["download-original-image-tooltip"]]:
      "下载原图，亦即下载 url 对应的原始图片，不包含画板效果（缩放 / 圆角 / 滤镜等）",
    [Download_Words["download-drawboard-image-tooltip"]]:
      "下载画板图，亦即下载当前画板所呈现的图片效果（包含缩放 / 圆角 / 滤镜等）",
    [Download_Words["download-multiple-caption"]]: "下载多节点",
  },
  en: {
    [Download_Words["download-plugin-header"]]: "Download",
    [Download_Words["download-button"]]: "Download",
    [Download_Words["download-original-image"]]: "Original",
    [Download_Words["download-drawboard-image"]]: "Drawboard",
    [Download_Words["download-original-image-tooltip"]]:
      "Download the original image, i.e. the image of the url, without any drawboard effect (scale / corner radius / filters, etc.)",
    [Download_Words["download-drawboard-image-tooltip"]]:
      "Download the drawboard image, i.e. the image displayed on the drawboard, with all drawboard effects (scale / corner radius / filters, etc.)",
    [Download_Words["download-multiple-caption"]]: "Multiple",
  },
};
