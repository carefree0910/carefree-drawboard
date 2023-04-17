import { useEffect } from "react";
import { useToast } from "@chakra-ui/toast";

import { FileDropper, FileDropperResponse, Lang } from "@carefree0910/core";
import { translate, useIsReady } from "@carefree0910/business";

import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { setDropping, hooksStore } from "@/stores/hooks";
import { uploadImage } from "@/actions/uploadImage";
import { importMeta } from "@/actions/importMeta";

export function useFileDropper(lang: Lang): void {
  function onDrop(): void {
    setDropping(true);
    setTimeout(() => {
      if (hooksStore.dropping) {
        toast(t, "info", translate(Toast_Words["dropping-message"], lang));
      }
    }, dropPatience);
  }

  async function failed(): Promise<void> {
    toast(t, "error", translate(Toast_Words["upload-image-error-message"], lang));
  }

  type UploadResponse = { success: boolean; reason: "none" | "unknown" | "type" | "upload" };
  async function onSuccessOne(res: FileDropperResponse): Promise<UploadResponse> {
    if (res.type !== "success" || !res.data) return { success: false, reason: "unknown" };
    const { type, source } = res.data;
    if (type !== "png" && type !== "jpeg") {
      return { success: false, reason: "type" };
    }

    const file = new File([source], `image.${type}`, { type });
    const uploadRes = await uploadImage(t, lang, file, {
      failed: async () => void 0,
    });
    if (!uploadRes) {
      return { success: false, reason: "upload" };
    }
    importMeta({
      t,
      lang,
      type: "upload",
      metaData: { ...uploadRes, isDrag: true },
    });
    return { success: true, reason: "none" };
  }
  async function onSuccess(resList: FileDropperResponse[]): Promise<void> {
    setDropping(false);
    if (resList.length === 0) return;
    toast(t, "info", translate(Toast_Words["uploading-image-message"], lang));
    const uploadResList = await Promise.all(resList.map((res) => onSuccessOne(res)));
    if (uploadResList.some((res) => res.reason === "type")) {
      toast(t, "error", translate(Toast_Words["strange-image-error-message"], lang));
    }
    if (uploadResList.some((res) => res.reason === "upload")) {
      failed();
    }
  }

  async function onError(resList: FileDropperResponse[]): Promise<void> {
    setDropping(false);
    console.log("fileDropper.error", resList);
    failed();
    if (resList.length === 0) return;
    resList.forEach((res) => {
      if (res.reason) {
        toast(t, "error", translate(res.reason, lang));
      }
    });
  }

  const t = useToast();
  const dropPatience = 500;

  useEffect(() => {
    const dropper = new FileDropper({
      onDrop,
      onSuccess,
      onError,
      urlType: "dataUrl",
      listenTarget: document.getElementById(BOARD_CONTAINER_ID) as HTMLElement,
      bypassWHCheck: true,
    });
    dropper.init();
    return () => {
      dropper.destroy();
    };
  }, [useIsReady(), lang]);
}
