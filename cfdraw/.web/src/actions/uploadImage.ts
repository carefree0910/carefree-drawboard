import { safeCall } from "@carefree0910/core";

import { toastWord } from "@/utils/toast";
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
  blob: Blob,
  { failed }: UploadImageOptions,
): Promise<IUploadImageResponseData | void> {
  return safeCall(
    async () => {
      const res = await Requests.postForm<{
        success: boolean;
        message: string;
        data: IUploadImageResponseData;
      }>("_python", "/upload_image", { image: blob });
      if (!res.success) {
        toastWord("warning", Toast_Words["upload-image-error-message"], {
          appendix: ` - ${res.message}`,
        });
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
