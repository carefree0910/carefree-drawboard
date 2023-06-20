import { safeCall } from "@carefree0910/core";

import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";
import { userStore } from "@/stores/user";

type UploadImageOptions = {
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
  { failed }: UploadImageOptions,
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
      });
      if (!res.success) {
        toastWord("error", Toast_Words["upload-image-error-message"], {
          appendix: ` - ${res.message}`,
        });
        return;
      }
      return res.data;
    },
    {
      success: async () => void 0,
      failed,
    },
  );
}
