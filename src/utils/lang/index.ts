import { Lang } from "@noli/core";
import { langDescriptions, langStore, updateDictionary } from "@noli/business";

import { toastLangRecords } from "./toast";

const initLangDirs = [toastLangRecords];

export function initializeLang(): void {
  langStore.updateProperty("tgt", "en");
  for (const lang of Object.keys(langDescriptions) as Lang[]) {
    initLangDirs.forEach((d) => updateDictionary(lang, d[lang]));
  }
}
