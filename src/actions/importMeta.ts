import { getRandomHash, shallowCopy } from "@noli/core";
import { BoardStore, translate, useAddNode } from "@noli/business";

import type { IMetaData, MetaType } from "@/schema/meta";
import type { IImportMeta } from "@/schema/meta";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { themeStore } from "@/stores/theme";
import { updateMeta } from "./update";
import { addNewImage, NewImageInfo } from "./addImage";

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
  const bboxInfo: NewImageInfo = { w, h };
  addNewImage(newAlias, url, {
    info: bboxInfo,
    meta: { type, data: metaData },
    callbacks: { success, failed },
    noSelect: false,
  });
}
function consumeAddText({ t, lang, type, metaData }: IImportMeta<"add.text">): void {
  const newAlias = `new.text.${getRandomHash()}`;
  const { textColor } = themeStore.styles;

  const success = async () => {
    toast(t, "success", translate(Toast_Words["add-text-success-message"], lang));
    updateTimestamps(newAlias);
  };
  const failed = async () => {
    toast(t, "error", translate(Toast_Words["add-text-error-message"], lang));
  };
  const { addText } = useAddNode({ success, failed });
  addText({ trace: true })({
    alias: newAlias,
    initColor: textColor,
    lang,
    autoFit: true,
    meta: { type, data: metaData },
  });
}
function consumePythonHttpFields({
  t,
  lang,
  type,
  metaData,
}: IImportMeta<"python.httpFields">): void {
  const failed = async (err: any) => {
    toast(
      t,
      "error",
      `${translate(Toast_Words["post-python-http-fields-plugin-error-message"], lang)} (${err})`,
    );
  };
  if (metaData.response.type === "image") {
    metaData.response.value.forEach(({ w, h, url }, i) => {
      const newAlias = `python.httpFields.${metaData.identifier}.${getRandomHash()}`;
      const bboxInfo: NewImageInfo = { w, h };
      const success = async () => {
        toast(t, "success", translate(Toast_Words["generate-image-success-message"], lang));
        updateTimestamps(newAlias);
      };
      const iMetaData = shallowCopy(metaData);
      iMetaData.response.value = metaData.response.value[i] as any;
      iMetaData.timestamp = Date.now();
      addNewImage(newAlias, url, {
        info: bboxInfo,
        meta: { type, data: iMetaData } as any,
        callbacks: { success, failed },
        noSelect: i !== 0,
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
