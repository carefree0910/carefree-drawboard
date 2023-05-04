import { langStore } from "@carefree0910/business";

import type { IStr } from "@/schema/misc";

export function parseIStr(str: IStr): string {
  const lang = langStore.tgt;
  return typeof str === "string" ? str : str[lang];
}
