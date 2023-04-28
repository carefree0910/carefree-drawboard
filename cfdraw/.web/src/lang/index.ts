import { Lang } from "@carefree0910/core";
import { langDescriptions, langStore, updateDictionary } from "@carefree0910/business";

import { uiLangRecords } from "./ui";
import { addLangRecords } from "./add";
import { brushLangRecords } from "./brush";
import { toastLangRecords } from "./toast";
import { tooltipLangRecords } from "./tooltip";
import { pluginsLangRecords } from "./plugins";
import { downloadLangRecords } from "./download";
import { projectsLangRecords } from "./projects";
import { settingsLangRecords } from "./settings";
import { nodeEditorLangRecords } from "./nodeEditor";

const initLangDirs = [
  uiLangRecords,
  toastLangRecords,
  tooltipLangRecords,
  pluginsLangRecords,
  settingsLangRecords,
  projectsLangRecords,
  addLangRecords,
  downloadLangRecords,
  nodeEditorLangRecords,
  brushLangRecords,
];

export function initializeLang(): void {
  const collected = new Set();
  let anyDuplicate = false;
  for (const lang of Object.keys(langDescriptions) as Lang[]) {
    initLangDirs.forEach((d) => {
      updateDictionary(lang, d[lang]);
      Object.keys(d[lang]).forEach((k) => {
        const _k = `${lang}-${k}`;
        if (collected.has(_k)) {
          console.warn(`Key ${k} is duplicated!`);
          anyDuplicate = true;
        }
        collected.add(_k);
      });
    });
  }
  if (!anyDuplicate) {
    console.log("No duplicate lang keys found, great job!");
  }
}
