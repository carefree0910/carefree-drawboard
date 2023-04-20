import { Dictionary, RectangleShapeNode, getRandomHash, shallowCopy } from "@carefree0910/core";
import { BoardStore, translate, useAddNode } from "@carefree0910/business";

import type { IMetaData, IPythonHttpFieldsMetaData, MetaType } from "@/schema/meta";
import type { IImportMeta } from "@/schema/meta";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { themeStore } from "@/stores/theme";
import { updateMeta } from "./update";
import { addNewText } from "./addText";
import { addNewImage, getNewRectangle, INewRectangle, NewImageInfo } from "./addImage";
import { getArrangements } from "./arrange";

// consumers

function updateTimestamps(alias: string, createTime?: number): void {
  const node = BoardStore.graph.getNode(alias);
  if (!node || node.type === "group" || !node.params.meta?.data) return;
  const now = Date.now();
  node.params.meta.data.timestamp = now;
  if (createTime) {
    node.params.meta.data.duration = now - createTime;
  }
  updateMeta(alias, node.params.meta);
}

const consumers: Record<MetaType, (input: IImportMeta<any>) => void> = {
  upload: consumeUpload,
  "add.text": consumeAddText,
  "add.sketch.path": consumeAddSketchPath,
  "python.httpFields": consumePythonHttpFields,
};
function consumeUpload({ t, lang, type, metaData }: IImportMeta<"upload">): void {
  const success = async () => {
    toast(t, "success", translate(Toast_Words["upload-image-success-message"], lang));
    updateTimestamps(newAlias);
  };
  const failed = async () => {
    toast(t, "error", translate(Toast_Words["upload-image-error-message"], lang));
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
function consumeAddText({ t, lang, type, metaData }: IImportMeta<"add.text">): void {
  const newAlias = `add.text.${getRandomHash()}`;
  const { textColor } = themeStore.styles;

  const success = async () => {
    toast(t, "success", translate(Toast_Words["add-text-success-message"], lang));
    updateTimestamps(newAlias);
  };
  const failed = async () => {
    toast(t, "error", translate(Toast_Words["add-text-error-message"], lang));
  };
  const { addText } = useAddNode({ success, failed });
  metaData.alias = newAlias;
  addText({ trace: true })({
    alias: newAlias,
    initColor: textColor,
    lang,
    autoFit: true,
    meta: { type, data: metaData },
  });
}
function consumeAddSketchPath(): void {
  throw Error("Add sketch path by `importMeta` is not supported yet.");
}
function consumePythonHttpFields({
  t,
  lang,
  type,
  metaData,
}: IImportMeta<"python.httpFields">): void {
  const success = async () => {
    toast(t, "success", translate(Toast_Words["generate-image-success-message"], lang));
  };
  const failed = async (err: any) => {
    toast(
      t,
      "error",
      `${translate(Toast_Words["post-python-http-fields-plugin-error-message"], lang)} (${err})`,
    );
  };
  const getNewAlias = () => `python.httpFields.${metaData.identifier}.${getRandomHash()}`;
  interface IPack<R> {
    data: R;
    alias: string;
    rectangle: RectangleShapeNode;
    metaData: IPythonHttpFieldsMetaData;
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
      iMetaData.timestamp = Date.now();
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
      (content) => {
        const numChars = content.length;
        const ratio = Math.sqrt(0.5 * numChars);
        const h = Math.ceil(fontSize * ratio);
        const w = h * 2;
        return { autoFit: true, wh: { w, h } };
      },
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

export function importMeta<T extends MetaType>({
  t,
  lang,
  type,
  metaData,
}: Omit<IImportMeta<T>, "metaData"> & { metaData?: IMetaData[T] }): void {
  consumers[type]({ t, lang, type, metaData });
}
