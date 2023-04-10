import { useToast } from "@chakra-ui/toast";

import { getAIHost, ImageURLs, Lang, loadImage, safeCall } from "@noli/core";
import { translate } from "@noli/business";

import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";

type UploadImageOptions = {
  failed: () => Promise<void>;
};

interface IUploadImageResponse {
  url: string;
  w: number;
  h: number;
}

export async function uploadImage(
  t: ReturnType<typeof useToast>,
  lang: Lang,
  blob: Blob,
  { failed }: UploadImageOptions,
): Promise<IUploadImageResponse | void> {
  return safeCall(
    async () => {
      const res = await Requests.postBlob<{
        success: boolean;
        message: string;
        data: IUploadImageResponse;
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
