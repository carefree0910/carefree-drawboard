import { Lang } from "@noli/core";

export enum Add_Words {
  "add-plugin-header" = "add-plugin-header",
  "new-project-button" = "new-project-button",
  "upload-image-button" = "upload-image-button",
  "add-text-button" = "add-text-button",
}

export const addLangRecords: Record<Lang, Record<Add_Words, string>> = {
  zh: {
    [Add_Words["add-plugin-header"]]: "添加",
    [Add_Words["new-project-button"]]: "新建项目",
    [Add_Words["upload-image-button"]]: "上传图片",
    [Add_Words["add-text-button"]]: "添加文字",
  },
  en: {
    [Add_Words["add-plugin-header"]]: "Add",
    [Add_Words["new-project-button"]]: "New Project",
    [Add_Words["upload-image-button"]]: "Upload Image",
    [Add_Words["add-text-button"]]: "Add Text",
  },
};
