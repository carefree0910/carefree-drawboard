import { Lang } from "@noli/core";
import { langDescriptions, langStore, updateDictionary } from "@noli/business";

import { uiLangRecords } from "./ui";
import { toastLangRecords } from "./toast";
import { pluginsLangRecords } from "./plugins";
import { settingsLangRecords } from "./settings";
import { projectsLangRecords } from "./projects";
import { addLangRecords } from "./add";

const initLangDirs = [
  uiLangRecords,
  toastLangRecords,
  pluginsLangRecords,
  settingsLangRecords,
  projectsLangRecords,
  addLangRecords,
];

export function initializeLang(): void {
  langStore.updateProperty("tgt", "en");
  for (const lang of Object.keys(langDescriptions) as Lang[]) {
    initLangDirs.forEach((d) => updateDictionary(lang, d[lang]));
  }
}
