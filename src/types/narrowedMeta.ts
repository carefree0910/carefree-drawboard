import type { useToast } from "@chakra-ui/toast";

import type { Lang } from "@noli/core";

import type { IMetaData, MetaType } from "./meta";

interface IUploadMetaData extends Partial<IMetaData> {
  w: number;
  h: number;
  url: string;
  isDrag: boolean;
  timestamp?: number;
}

export interface INarrowedMetaData {
  upload: IUploadMetaData;
}

export interface IImportMeta<T extends MetaType> {
  t: ReturnType<typeof useToast>;
  lang: Lang;
  type: T;
  metaData: INarrowedMetaData[T];
}
