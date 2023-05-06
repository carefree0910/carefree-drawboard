import { BBox, TextNode } from "@carefree0910/core";
import { BoardStore, BusinessOpCallbacks, useSafeExecute } from "@carefree0910/business";

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
  const newText = new TextNode(
    alias,
    { content, fontSize },
    opt.bbox.fields,
    { z: BoardStore.graph.minZIndex - 1 },
    undefined,
    undefined,
    { color: themeStore.styles.textColor },
  );
  newText.meta = opt.meta;
  console.log("newText: ", newText.snapshot());
  useSafeExecute("addJson", null, true, opt.callbacks, {
    noSelect: opt.noSelect ?? true,
    safeOpt: {
      retry: 3,
      retryInterval: 500,
    },
  })({ alias, json: newText.toJson() });
}
