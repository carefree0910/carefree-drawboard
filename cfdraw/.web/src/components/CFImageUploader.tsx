import Upload from "rc-upload";
import React, { ReactNode } from "react";
import { observer } from "mobx-react-lite";

import { langStore, translate } from "@carefree0910/business";

import { toast } from "@/utils/toast";
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
  const lang = langStore.tgt;

  return (
    <Upload
      className={className}
      accept=".png, .jpeg, .jpg, .webp"
      customRequest={async ({ file }) => {
        async function failed(e: any): Promise<void> {
          toast("error", `${translate(Toast_Words["upload-image-error-message"], lang)} - ${e}`);
        }
        toast("info", translate(Toast_Words["uploading-image-message"], lang));
        const blob = file as Blob;
        const uploadRes = await uploadImage(lang, blob, { failed });
        if (!uploadRes) return;
        onUpload?.(uploadRes.url);
        if (!addToBoard) return;
        importMeta({ lang, type: "upload", metaData: { ...uploadRes, isDrag: false } });
      }}>
      {children}
    </Upload>
  );
};

export default observer(CFImageUploader);
