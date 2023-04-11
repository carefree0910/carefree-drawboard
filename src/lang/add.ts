import { Lang } from "@noli/core";

export enum Add_Words {
  "add-plugin-header" = "add-plugin-header",
}

export const addLangRecords: Record<Lang, Record<Add_Words, string>> = {
  zh: {
    [Add_Words["add-plugin-header"]]: "添加",
  },
  en: {
    [Add_Words["add-plugin-header"]]: "Add",
  },
};
