import { useEffect } from "react";

import { FileDropper, FileDropperResponse } from "@carefree0910/core";
import { langStore, useIsReady } from "@carefree0910/business";

import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { BOARD_CONTAINER_ID } from "@/utils/constants";
import { setDropping, hooksStore } from "@/stores/hooks";
import { uploadImage } from "@/actions/uploadImage";
import { importMeta } from "@/actions/importMeta";
import { useIsSetup } from "./useSetup";

export function useFileDropper(): void {
  function onDrop(): void {
    setDropping(true);
    setTimeout(() => {
      if (hooksStore.dropping) {
        toastWord("info", Toast_Words["dropping-message"]);
      }
    }, dropPatience);
  }

  async function failed(): Promise<void> {
    toastWord("error", Toast_Words["upload-image-error-message"]);
  }

  type UploadResponse = { success: boolean; reason: "none" | "unknown" | "type" | "upload" };
  async function onSuccessOne(res: FileDropperResponse): Promise<UploadResponse> {
    if (res.type !== "success" || !res.data) return { success: false, reason: "unknown" };
    const { type, source } = res.data;
    if (type !== "png" && type !== "jpeg") {
      return { success: false, reason: "type" };
    }

    const file = new File([source], `image.${type}`, { type });
    const uploadRes = await uploadImage(file, { failed: async () => void 0 });
    if (!uploadRes) {
      return { success: false, reason: "upload" };
    }
    importMeta({
      lang: langStore.tgt,
      type: "upload",
      metaData: { ...uploadRes, isDrag: true },
    });
    return { success: true, reason: "none" };
  }
  async function onSuccess(resList: FileDropperResponse[]): Promise<void> {
    setDropping(false);
    if (resList.length === 0) return;
    toastWord("info", Toast_Words["uploading-image-message"]);
    const uploadResList = await Promise.all(resList.map((res) => onSuccessOne(res)));
    if (uploadResList.some((res) => res.reason === "type")) {
      toastWord("error", Toast_Words["strange-image-error-message"]);
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
        toastWord("error", res.reason);
      }
    });
  }

  const dropPatience = 500;
  const isReady = useIsReady();
  const isSetup = useIsSetup();

  useEffect(() => {
    if (!isReady || !isSetup) return;

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
  }, [isReady, isSetup]);
}
