import { RectangleShapeNode, getRandomHash, shallowCopy } from "@carefree0910/core";
import { BoardStore, useAddNode, useDefaultTextContent } from "@carefree0910/business";

import type { IMetaData, IPythonFieldsMetaData, MetaType } from "@/schema/meta";
import type { IImportMeta } from "@/schema/meta";
import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { themeStore } from "@/stores/theme";
import { updateMeta } from "./update";
import { addNewText } from "./addText";
import { addNewImage, getNewRectangle, INewRectangle, NewImageInfo } from "./addImage";
import { getArrangements } from "./arrange";

// helper functions

function updateElapsedTimes(alias: string): void {
  const node = BoardStore.graph.getNode(alias);
  if (!node || node.type === "group" || !node.params.meta?.data) return;
  node.params.meta.data.elapsedTimes = { endTime: Date.now() };
  updateMeta(alias, node.params.meta);
}

function getWHFromContent(content: string, fontSize: number): { w: number; h: number } {
  const numChars = content.length;
  const ratio = Math.sqrt(0.75 * numChars);
  const h = Math.ceil(fontSize * ratio);
  const w = h * 2;
  return { w, h };
}

// consumers

const consumers: Record<MetaType, (input: IImportMeta<any>) => void> = {
  upload: consumeUpload,
  "add.text": consumeAddText,
  "add.sketch.path": consumeAddSketchPath,
  "python.fields": consumePythonFields,
};
function consumeUpload({ type, metaData }: IImportMeta<"upload">): void {
  const success = async () => {
    toastWord("success", Toast_Words["upload-image-success-message"]);
    updateElapsedTimes(newAlias);
  };
  const failed = async () => {
    toastWord("error", Toast_Words["upload-image-error-message"]);
  };
  const { w, h, url, isDrag } = metaData;
  const prefix = isDrag ? "drag-" : "";
  const newAlias = `${prefix}upload.${getRandomHash()}`;
  metaData.alias = newAlias;
  const bboxInfo: NewImageInfo = { w, h };
  addNewImage(newAlias, url, {
    info: bboxInfo,
    meta: { type, data: metaData },
    callbacks: { success, failed },
    noSelect: false,
  });
}
function consumeAddText({ lang, type, metaData }: IImportMeta<"add.text">): void {
  const newAlias = `add.text.${getRandomHash()}`;
  const { textColor } = themeStore.styles;

  const success = async () => {
    toastWord("success", Toast_Words["add-text-success-message"]);
    updateElapsedTimes(newAlias);
  };
  const failed = async () => {
    toastWord("error", Toast_Words["add-text-error-message"]);
  };
  const { addText } = useAddNode({ success, failed });
  metaData.alias = newAlias;
  const content = useDefaultTextContent(lang);
  const fontSize = 64;
  const { w, h } = getWHFromContent(content, fontSize);
  addText({ trace: true })({
    alias: newAlias,
    initColor: textColor,
    lang,
    autoFit: true,
    meta: { type, data: metaData },
    content,
    fontSize,
    w,
    h,
  });
}
function consumeAddSketchPath(): void {
  throw Error("Add sketch path by `importMeta` is not supported yet.");
}
function consumePythonFields({ type, metaData }: IImportMeta<"python.fields">): void {
  const success = async () => {
    toastWord("success", Toast_Words["generate-image-success-message"]);
  };
  const failed = async (err: any) => {
    toastWord("error", Toast_Words["post-python-http-fields-plugin-error-message"], {
      appendix: ` (${err})`,
    });
  };
  const getNewAlias = () => `${type}.${metaData.identifier}.${getRandomHash()}`;
  interface IPack<R> {
    data: R;
    alias: string;
    rectangle: RectangleShapeNode;
    metaData: IPythonFieldsMetaData;
  }
  function gatherPacks<T, R>(
    responses: T[],
    getRectangleInfo: (res: T) => INewRectangle,
    getData: (res: T) => R,
  ): IPack<R>[] {
    const packs: IPack<R>[] = [];
    responses.forEach((res, i) => {
      const newAlias = getNewAlias();
      const rectangle = getNewRectangle(`${i}.${getRandomHash()}`, getRectangleInfo(res));
      const iMetaData = shallowCopy(metaData);
      iMetaData.response.value = metaData.response.value[i] as any;
      iMetaData.alias = newAlias;
      packs.push({ data: getData(res), alias: newAlias, rectangle, metaData: iMetaData });
    });
    return packs;
  }
  function getCallbacks(isLast: boolean) {
    return { success: isLast ? success : async () => void 0, failed };
  }
  if (metaData.response.type === "image") {
    const packs = gatherPacks(
      metaData.response.value,
      ({ w, h }) => ({ autoFit: true, wh: { w, h } }),
      ({ url }) => ({ url }),
    );
    const targets = getArrangements(packs.map(({ rectangle }) => rectangle)).targets;
    packs.forEach(({ data: { url }, alias, metaData }, i) => {
      const isLast = i === packs.length - 1;
      addNewImage(alias, url, {
        info: targets[i].bbox,
        meta: { type, data: metaData },
        callbacks: getCallbacks(isLast),
        noSelect: !isLast,
      });
    });
  } else if (metaData.response.type === "text") {
    const fontSize = 48;
    const packs = gatherPacks(
      metaData.response.value,
      (content) => ({ autoFit: true, wh: getWHFromContent(content, fontSize) }),
      (content) => ({ content }),
    );
    const targets = getArrangements(packs.map(({ rectangle }) => rectangle)).targets;
    packs.forEach(({ data: { content }, alias, metaData }, i) => {
      const isLast = i === packs.length - 1;
      addNewText(alias, content, fontSize, {
        bbox: targets[i].bbox,
        meta: { type, data: metaData },
        callbacks: getCallbacks(isLast),
        noSelect: !isLast,
      });
    });
  }
}

// import api

export function importMeta<T extends MetaType>({ lang, type, metaData }: IImportMeta<T>): void {
  metaData.lang = lang;
  consumers[type]({ lang, type, metaData });
}
