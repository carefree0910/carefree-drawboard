import { getRandomHash } from "@noli/core";
import { translate } from "@noli/business";

import type { MetaType } from "@/types/meta";
import type { IImportMeta } from "@/types/narrowedMeta";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/utils/lang/toast";
import { addNewImage, NewImageInfo } from "./addImage";
import { pollTask, pushTask } from "./runTasks";
import { revertTaskData } from "./handleTaskData";
import { getSingleUrl } from "./handleResponse";

// consumers

const consumers: Record<MetaType, (input: IImportMeta<any>) => void> = {
  upload: consumeUpload,
  "txt2img.sd": consumeTxt2ImgSD,
};
function consumeUpload({ t, lang, type, metaData }: IImportMeta<"upload">): void {
  const success = async () => {
    const now = Date.now();
    metaData.timestamp = now;
    metaData.duration = now - createTime;
    toast(t, "success", translate(Toast_Words["upload-image-success-message"], lang));
  };
  const failed = async () => {
    toast(t, "error", translate(Toast_Words["upload-image-error-message"], lang));
  };
  const createTime = Date.now();
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
function consumeTxt2ImgSD({ t, lang, type, metaData }: IImportMeta<"txt2img.sd">): void {
  const failed = async (err: any) => {
    toast(t, "error", `${translate(Toast_Words["generate-image-error-message"], lang)} (${err})`);
  };
  const createTime = Date.now();
  pushTask("txt2img.sd", metaData)
    .then(({ taskId, taskData }) => pollTask(metaData.source, taskId, taskData))
    .then(({ res, taskData }) => {
      const url = getSingleUrl(res);
      const newAlias = `txt2img.sd.${getRandomHash()}`;
      const bboxInfo: NewImageInfo = { w: taskData.w, h: taskData.h };
      const nodeMetaData = revertTaskData("txt2img.sd", taskData);
      const success = async () => {
        const now = Date.now();
        nodeMetaData.timestamp = now;
        nodeMetaData.duration = now - createTime;
        toast(t, "success", translate(Toast_Words["generate-image-success-message"], lang));
      };
      addNewImage(newAlias, url, {
        info: bboxInfo,
        meta: { type, data: nodeMetaData },
        callbacks: { success, failed },
        noSelect: false,
      });
    })
    .catch((err) => failed(err));
}

// import api

export function importMeta<T extends MetaType>(data: IImportMeta<T>): void {
  consumers[data.type](data);
}
