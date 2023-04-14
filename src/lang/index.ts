import { Lang } from "@noli/core";
import { langDescriptions, langStore, updateDictionary } from "@noli/business";

import { uiLangRecords } from "./ui";
import { addLangRecords } from "./add";
import { toastLangRecords } from "./toast";
import { pluginsLangRecords } from "./plugins";
import { downloadLangRecords } from "./download";
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
  downloadLangRecords,
  nodeEditorLangRecords,
];

export function initializeLang(): void {
  langStore.updateProperty("tgt", "en");
  const collected = new Set();
  let anyDuplicate = false;
  for (const lang of Object.keys(langDescriptions) as Lang[]) {
    initLangDirs.forEach((d) => {
      updateDictionary(lang, d[lang]);
      Object.keys(d[lang]).forEach((k) => {
        if (collected.has(k)) {
          console.warn(`Key ${k} is duplicated!`);
          anyDuplicate = true;
        }
        collected.add(`${lang}-${k}`);
      });
    });
  }
  if (!anyDuplicate) {
    console.log("No duplicate lang keys found, great job!");
  }
}
