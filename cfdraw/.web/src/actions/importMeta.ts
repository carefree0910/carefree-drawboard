import { RectangleShapeNode, getRandomHash, shallowCopy } from "@carefree0910/core";
import { BoardStore, useAddNode, useDefaultTextContent } from "@carefree0910/business";

import type { IPythonFieldsMetaData, IPythonResults, MetaType } from "@/schema/meta";
import type { IImportMeta } from "@/schema/meta";
import { toastWord } from "@/utils/toast";
import { DEFAULT_FONT_SIZE, IMAGE_PLACEHOLDER, NSFW_IMAGE_PLACEHOLDER } from "@/utils/constants";
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
  addNewImage(
    newAlias,
    { src: url, placeholder: IMAGE_PLACEHOLDER },
    {
      info: bboxInfo,
      meta: { type, data: metaData },
      callbacks: { success, failed },
      noSelect: false,
    },
  );
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
  const fontSize = DEFAULT_FONT_SIZE;
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
interface IPack<R> {
  res: R;
  alias: string;
  rectangle: RectangleShapeNode;
  metaData: IPythonFieldsMetaData;
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
  function gatherPacks<T extends IPythonResults>(
    results: T,
    getRectangleInfo: (res: T["value"][number]) => INewRectangle,
  ): IPack<T["value"][number]>[] {
    const packs: IPack<T["value"][number]>[] = [];
    results.value.forEach((res, i) => {
      const newAlias = getNewAlias();
      const rectangle = getNewRectangle(`${i}.${getRandomHash()}`, getRectangleInfo(res));
      let iMetaData = shallowCopy(metaData);
      iMetaData.response.value = metaData.response.value[i] as any;
      iMetaData.alias = newAlias;
      if (!res.safe) {
        if (results.type === "text") {
          results.value[i].text = `NSFW 🙈 (${results.value[i].reason})`;
        } else {
          results.value[i].url = NSFW_IMAGE_PLACEHOLDER;
          iMetaData.response.extra ??= {};
          iMetaData.response.extra.reason = results.value[i].reason;
          toastWord("warning", Toast_Words["nsfw-image-detected-warning-message"], {
            appendix: ` (${results.value[i].reason})`,
          });
        }
      }
      packs.push({
        res,
        alias: newAlias,
        rectangle,
        metaData: iMetaData,
      });
    });
    return packs;
  }
  function getCallbacks(isLast: boolean) {
    return { success: isLast ? success : async () => void 0, failed };
  }
  if (metaData.response.type === "image") {
    const packs = gatherPacks(metaData.response, ({ w, h }) => ({ autoFit: true, wh: { w, h } }));
    const targets = getArrangements(packs.map(({ rectangle }) => rectangle)).targets;
    const anyUnsafe = metaData.response.value.some((res) => !res.safe);
    packs.forEach(({ res: { url }, alias, metaData }, i) => {
      const isLast = i === packs.length - 1;
      addNewImage(
        alias,
        { src: url, placeholder: IMAGE_PLACEHOLDER },
        {
          info: targets[i].bbox,
          meta: { type, data: metaData },
          callbacks: getCallbacks(isLast && !anyUnsafe),
          noSelect: !isLast,
        },
      );
    });
  } else if (metaData.response.type === "text") {
    const fontSize = DEFAULT_FONT_SIZE;
    const packs = gatherPacks(metaData.response, ({ text }) => ({
      autoFit: true,
      wh: getWHFromContent(text, fontSize),
    }));
    const targets = getArrangements(packs.map(({ rectangle }) => rectangle)).targets;
    packs.forEach(({ res: { text }, alias, metaData }, i) => {
      const isLast = i === packs.length - 1;
      addNewText(alias, text, fontSize, {
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
