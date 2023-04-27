import { langStore, translate } from "@carefree0910/business";

import { UI_Words } from "@/lang/ui";
import { titleCaseWord } from "@/utils/misc";

export function getLabel(field: string): string {
  const labelWord = `${field}-field-label`;
  return labelWord in UI_Words ? translate(labelWord, langStore.tgt) : titleCaseWord(field);
}
export function getPlaceholder(field: string): string {
  const placeholderWord = `${field}-field-placeholder`;
  return placeholderWord in UI_Words
    ? translate(placeholderWord, langStore.tgt)
    : titleCaseWord(field);
}
