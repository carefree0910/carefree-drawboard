import {
  BBox,
  getCenteredBBox,
  ImageNode,
  IRectangleShapeNode,
  RectangleShapeNode,
} from "@noli/core";
import { BoardStore, BusinessOpCallbacks, useSafeExecute } from "@noli/business";

import type { IMeta } from "@/types/meta";

export type VirtualInfo = IRectangleShapeNode | { w: number; h: number; type?: undefined };
export type NewImageInfo = VirtualInfo | (BBox & { type?: undefined });

export function getNewRectangle(
  alias: string,
  info: BBox | { autoFit: boolean; wh: { w: number; h: number } },
): RectangleShapeNode {
  const { w, h } = info.wh;
  const node = new RectangleShapeNode(
    alias,
    { x: 0, y: 0, w, h },
    BBox.from(0, 0, w, h).fields,
    { z: BoardStore.graph.minZIndex - 1 },
    [{ type: "color", src: "rgb(253, 254, 255)", opacity: 1.0 }],
    [{ width: 1, color: "#333333", opacity: 0.6 }],
  );
  if (info instanceof BBox) {
    node.bboxFields = info.fields;
  } else if (info.autoFit) {
    node.bboxFields = getCenteredBBox(w, h, BoardStore.board).fields;
  }
  return node;
}

export function rectangleToImage(
  rectangle: IRectangleShapeNode,
  src: string,
  alias?: string,
): ImageNode {
  return new ImageNode(
    alias ?? rectangle.alias,
    rectangle.params,
    rectangle.bboxFields,
    rectangle.layerParams,
    undefined,
    undefined,
    { src },
  );
}

export function getNewImageNode(alias: string, src: string, info: NewImageInfo): ImageNode {
  const newRectangle = info.type
    ? info
    : getNewRectangle(alias, info instanceof BBox ? info : { autoFit: true, wh: info });
  return rectangleToImage(newRectangle, src);
}

export function addNewImage(
  alias: string,
  src: string,
  opt: {
    info: NewImageInfo;
    meta: IMeta;
    callbacks?: BusinessOpCallbacks;
    noSelect?: boolean;
  },
): void {
  const newImage = getNewImageNode(alias, src, opt.info);
  newImage.meta = opt.meta;
  console.log("newImage: ", newImage.snapshot());
  useSafeExecute("addJson", null, true, opt.callbacks, {
    noSelect: opt.noSelect ?? true,
    safeOpt: {
      retry: 3,
      retryInterval: 500,
    },
  })({ alias, json: newImage.toJson() });
}
