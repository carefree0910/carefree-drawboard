import { useToast } from "@chakra-ui/toast";

import { getRandomHash, Lang } from "@noli/core";
import { translate } from "@noli/business";

import type { MetaType } from "@/types/meta";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/utils/lang/toast";
import { addNewImage, NewImageInfo } from "./addImage";

// narrow down meta data

interface IUploadData {
  w: number;
  h: number;
  url: string;
  isDrag: boolean;
  timestamp?: number;
}

export interface INarrowedMetaData {
  upload: IUploadData;
}

// consumers

const consumers: Record<MetaType, (input: IImportMeta<MetaType>) => void> = {
  upload: consumeUpload,
};
function consumeUpload({ t, lang, type, metaData }: IImportMeta<"upload">): void {
  const success = async () => {
    metaData.timestamp = Date.now();
    toast(t, "success", translate(Toast_Words["upload-seccess-message"], lang));
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

// import api

export interface IImportMeta<T extends MetaType> {
  t: ReturnType<typeof useToast>;
  lang: Lang;
  type: T;
  metaData: INarrowedMetaData[T];
}
export function importMeta<T extends MetaType>(data: IImportMeta<T>): void {
  consumers[data.type](data);
}
