import { Lang, safeCall } from "@noli/core";
import { translate } from "@noli/business";

import type { IToast } from "@/schema/misc";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";

type UploadImageOptions = {
  failed: (e: any) => Promise<void>;
};

interface IUploadImageResponseData {
  w: number;
  h: number;
  url: string;
}

export async function uploadImage(
  t: IToast,
  lang: Lang,
  blob: Blob,
  { failed }: UploadImageOptions,
): Promise<IUploadImageResponseData | void> {
  return safeCall(
    async () => {
      const res = await Requests.postBlob<{
        success: boolean;
        message: string;
        data: IUploadImageResponseData;
      }>("_python", "/upload_image", { key: "image", blob });
      if (!res.success) {
        toast(
          t,
          "warning",
          `${translate(Toast_Words["upload-image-error-message"], lang)} - ${res.message}`,
        );
        throw Error;
      }
      return res.data;
    },
    {
      success: async () => void 0,
      failed,
    },
  );
}
