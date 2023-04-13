import { Lang } from "@noli/core";
import { langDescriptions, langStore, updateDictionary } from "@noli/business";

import { uiLangRecords } from "./ui";
import { addLangRecords } from "./add";
import { toastLangRecords } from "./toast";
import { pluginsLangRecords } from "./plugins";
import { projectsLangRecords } from "./projects";
import { settingsLangRecords } from "./settings";
import { nodeEditorLangRecords } from "./nodeEditor";

const initLangDirs = [
  uiLangRecords,
  toastLangRecords,
  pluginsLangRecords,
  settingsLangRecords,
  projectsLangRecords,
  addLangRecords,
  nodeEditorLangRecords,
];

export function initializeLang(): void {
  langStore.updateProperty("tgt", "en");
  for (const lang of Object.keys(langDescriptions) as Lang[]) {
    initLangDirs.forEach((d) => updateDictionary(lang, d[lang]));
  }
}
