import { Lang } from "@carefree0910/core";

export enum Add_Words {
  "new-project-button" = "new-project-button",
  "add-frame-button" = "add-frame-button",
}

export const addLangRecords: Record<Lang, Record<Add_Words, string>> = {
  zh: {
    [Add_Words["new-project-button"]]: "新建项目",
    [Add_Words["add-frame-button"]]: "添加画框",
  },
  en: {
    [Add_Words["new-project-button"]]: "New Project",
    [Add_Words["add-frame-button"]]: "Add Frame",
  },
};
