import { BBox, TextNode } from "@carefree0910/core";
import {
  BoardStore,
  BusinessOpCallbacks,
  useAddNode,
  useSafeExecute,
} from "@carefree0910/business";

import type { IMeta } from "@/schema/meta";
import { themeStore } from "@/stores/theme";

export function addNewText(
  alias: string,
  content: string,
  fontSize: number,
  opt: {
    bbox: BBox;
    meta: IMeta;
    callbacks?: BusinessOpCallbacks;
    noSelect?: boolean;
  },
): void {
  useAddNode().addText({ trace: true, noSelect: opt.noSelect ?? true, callbacks: opt.callbacks })({
    alias,
    content,
    fontSize,
    color: themeStore.styles.textColor,
    bboxFields: opt.bbox.fields,
    meta: opt.meta,
  });
}
