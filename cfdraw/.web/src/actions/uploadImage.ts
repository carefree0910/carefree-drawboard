import { safeCall, Requests, getImageSizeOf } from "@carefree0910/core";
import { Toast_Words, toastWord } from "@carefree0910/components";

import { userStore } from "@/stores/user";

type UploadImageOptions = {
  isSVG?: boolean;
  failed: (e: any) => Promise<void>;
};

export interface IUploadImageResponseData {
  w: number;
  h: number;
  url: string;
  safe: boolean;
  reason: string;
}

export async function uploadImage(
  blob: Blob,
  { isSVG, failed }: UploadImageOptions,
): Promise<IUploadImageResponseData | void> {
  return safeCall(
    async () => {
      const res = await Requests.postForm<{
        success: boolean;
        message: string;
        data: IUploadImageResponseData;
      }>("_python", "/upload_image", {
        image: blob,
        userId: userStore.userId,
        userJson: userStore.json,
        isSVG: isSVG ? "1" : "0",
      });
      if (!res.success) {
        toastWord("error", Toast_Words["upload-image-error-message"], {
          appendix: ` - ${res.message}`,
        });
        return;
      }
      if (isSVG) {
        const objURL = URL.createObjectURL(blob);
        const { w, h } = await getImageSizeOf(objURL);
        URL.revokeObjectURL(objURL);
        res.data.w = w;
        res.data.h = h;
      }
      return res.data;
    },
    {
      success: async () => void 0,
      failed,
    },
  );
}
