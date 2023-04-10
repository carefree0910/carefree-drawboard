import { getRandomHash, Logger, shallowCopy } from "@noli/core";
import { BoardStore, translate } from "@noli/business";

import type { MetaType } from "@/types/meta";
import type { IImportMeta, INarrowedMetaData } from "@/types/narrowedMeta";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { addNewImage, NewImageInfo } from "./addImage";
import { pollTask, pushTask } from "./runTasks";
import { getTaskData, revertTaskData } from "./handleTaskData";
import { getSingleUrl } from "./handleResponse";
import { allTaskTypes, TaskTypes } from "@/types/tasks";

// consumers

function updateTimestamps(alias: string, createTime?: number): void {
  const node = BoardStore.graph.getNode(alias);
  if (!node || node.type === "group" || !node.params.meta?.data) return;
  const now = Date.now();
  node.params.meta.data.timestamp = now;
  if (createTime) {
    node.params.meta.data.duration = now - createTime;
  }
}

const consumers: Record<MetaType, (input: IImportMeta<any>) => void> = {
  upload: consumeUpload,
  "txt2img.sd": consumeTxt2ImgSD,
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
        toast(t, "success", translate(Toast_Words["generate-image-success-message"], lang));
        updateTimestamps(newAlias, createTime);
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
  if (metaData.type === "image") {
    metaData.value.forEach(({ w, h, url }, i) => {
      const newAlias = `python.httpFields.${metaData.data.identifier}.${getRandomHash()}`;
      const bboxInfo: NewImageInfo = { w, h };
      const success = async () => {
        toast(t, "success", translate(Toast_Words["generate-image-success-message"], lang));
        updateTimestamps(newAlias);
      };
      const iMetaData = shallowCopy(metaData);
      iMetaData.value = metaData.value[i] as any;
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
}: Omit<IImportMeta<T>, "metaData"> & { metaData?: INarrowedMetaData[T] }): void {
  if (!metaData) {
    if (!allTaskTypes.includes(type)) {
      Logger.warn(
        `'metaData' is not provided but 'type' (${type}) is not a 'TaskType', so nothing will happen. ` +
          `Please either provide 'metaData' explicitly, or specify 'type' as a 'TaskType' ` +
          `(available 'TaskType's are: ${allTaskTypes.join(", ")})`,
      );
      return;
    }
    const task = type as TaskTypes;
    metaData = revertTaskData(task, getTaskData(task)) as any;
  }
  consumers[type]({ t, lang, type, metaData });
}
