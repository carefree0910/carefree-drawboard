import { useToast } from "@chakra-ui/toast";

import {
  getAIHost,
  ImageURLs,
  Lang,
  loadImage,
  safeCall,
  uploadImage as uploadImage_,
} from "@noli/core";
import { translate } from "@noli/business";

import { toast } from "@/utils/toast";
import { Toast_Words } from "@/utils/lang/toast";

type UploadImageOptions<T extends boolean> = {
  failed: () => Promise<void>;
  returnWH: T;
  noAudit?: boolean;
};

export async function uploadImage<T extends boolean>(
  t: ReturnType<typeof useToast>,
  lang: Lang,
  blob: Blob,
  { failed, returnWH, noAudit }: UploadImageOptions<T>,
): Promise<
  (T extends true ? { urls: ImageURLs; wh: { w: number; h: number } } : ImageURLs) | void
> {
  return safeCall(
    async () => {
      const urls = await uploadImage_(getAIHost("prod"), blob, noAudit);
      if (!urls.safe) {
        toast(
          t,
          "warning",
          `${translate(Toast_Words["upload-image-not-safe-warning-message"], lang)}`,
        );
        throw Error;
      }
      if (!returnWH) return urls as any;
      const image = await safeCall(() => loadImage(blob), {
        success: async () => void 0,
        failed: async () => void 0,
      });
      if (!image) throw Error;
      return {
        urls,
        wh: { w: image.naturalWidth, h: image.naturalHeight },
      };
    },
    {
      success: async () => void 0,
      failed,
    },
  );
}
