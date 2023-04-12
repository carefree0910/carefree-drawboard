import type { Lang } from "@noli/core";
import { translate } from "@noli/business";

import { UI_Words } from "@/lang/ui";
import { titleCaseWord } from "@/utils/misc";

export function getLabel(field: string, lang: Lang): string {
  const labelWord = `${field}-field-label`;
  return labelWord in UI_Words ? translate(labelWord, lang) : titleCaseWord(field);
}
export function getPlaceholder(field: string, lang: Lang): string {
  const placeholderWord = `${field}-field-placeholder`;
  return placeholderWord in UI_Words ? translate(placeholderWord, lang) : titleCaseWord(field);
}
