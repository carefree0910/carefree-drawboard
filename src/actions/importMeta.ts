import { useToast } from "@chakra-ui/toast";

import { getRandomHash, Lang } from "@noli/core";
import { translate } from "@noli/business";

import type { MetaType } from "@/types/meta";
import type { IImportMeta } from "@/types/narrowedMeta";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/utils/lang/toast";
import { addNewImage, NewImageInfo } from "./addImage";
import { pollTask, pushTask } from "./runTasks";
import { metaStore } from "@/stores/meta";
import { revertTaskData } from "./handleTaskData";

// consumers

const consumers: Record<MetaType, (input: IImportMeta<any>) => void> = {
  upload: consumeUpload,
  "txt2img.sd": consumeTxt2ImgSD,
};
function consumeUpload({ t, lang, type, metaData }: IImportMeta<"upload">): void {
  const success = async () => {
    metaData.timestamp = Date.now();
    toast(t, "success", translate(Toast_Words["upload-image-success-message"], lang));
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
function consumeTxt2ImgSD({ t, lang, type, metaData }: IImportMeta<"txt2img.sd">): void {
  const failed = async (err: any) => {
    toast(t, "error", `${translate(Toast_Words["generate-image-error-message"], lang)} (${err})`);
  };
  pushTask("txt2img.sd", metaData)
    .then(({ taskId, taskData }) => pollTask(metaData.source, taskId, taskData))
    .then(({ res, taskData }) => {
      const url = res.data?.cdn;
      if (!url) throw Error("cdn url not found in response");
      const newAlias = `txt2img.sd.${getRandomHash()}`;
      const bboxInfo: NewImageInfo = { w: taskData.w, h: taskData.h };
      const nodeMetaData = revertTaskData("txt2img.sd", taskData);
      const success = async () => {
        nodeMetaData.timestamp = Date.now();
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
