import Upload from "rc-upload";
import React, { ReactNode } from "react";
import { observer } from "mobx-react-lite";

import { langStore } from "@carefree0910/business";

import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { importMeta } from "@/actions/importMeta";
import { uploadImage } from "@/actions/uploadImage";

export interface CFImageUploaderProps {
  className?: string;
  children: ReactNode;
  onUpload?: (url: string) => void;
  addToBoard?: boolean;
}

const CFImageUploader: React.FC<CFImageUploaderProps> = ({
  className,
  children,
  onUpload,
  addToBoard = true,
}) => {
  return (
    <Upload
      className={className}
      accept=".png, .jpeg, .jpg, .webp"
      customRequest={async ({ file }) => {
        async function failed(e: any): Promise<void> {
          toastWord("error", Toast_Words["upload-image-error-message"], { appendix: ` - ${e}` });
        }
        toastWord("info", Toast_Words["uploading-image-message"]);
        const blob = file as Blob;
        const uploadRes = await uploadImage(blob, { failed });
        if (!uploadRes) return;
        onUpload?.(uploadRes.url);
        if (!addToBoard) return;
        importMeta({
          lang: langStore.tgt,
          type: "upload",
          metaData: { ...uploadRes, isDrag: false },
        });
      }}>
      {children}
    </Upload>
  );
};

export default observer(CFImageUploader);
