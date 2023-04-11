import { Lang } from "@noli/core";

export enum Add_Words {
  "add-plugin-header" = "add-plugin-header",
  "upload-image-button" = "upload-image-button",
}

export const addLangRecords: Record<Lang, Record<Add_Words, string>> = {
  zh: {
    [Add_Words["add-plugin-header"]]: "添加",
    [Add_Words["upload-image-button"]]: "上传图片",
  },
  en: {
    [Add_Words["add-plugin-header"]]: "Add",
    [Add_Words["upload-image-button"]]: "Upload Image",
  },
};
