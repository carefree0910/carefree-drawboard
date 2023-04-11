import Upload from "rc-upload";
import React, { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { importMeta } from "@/actions/importMeta";
import { uploadImage } from "@/actions/uploadImage";

export interface ImageUploaderProps {
  className?: string;
  children: ReactNode;
  onUpload?: (url: string) => void;
  addToBoard?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  className,
  children,
  onUpload,
  addToBoard = true,
}) => {
  const t = useToast();
  const lang = langStore.tgt;

  return (
    <Upload
      className={className}
      accept=".png, .jpeg, .jpg, .webp"
      customRequest={async ({ file }) => {
        async function success(): Promise<void> {
          toast(t, "success", translate(Toast_Words["upload-image-success-message"], lang));
        }
        async function failed(): Promise<void> {
          toast(t, "error", translate(Toast_Words["upload-image-error-message"], lang));
        }

        toast(t, "info", translate(Toast_Words["uploading-image-message"], lang));
        const blob = file as Blob;
        const uploadRes = await uploadImage(t, lang, blob, { failed });
        if (!uploadRes) return;
        onUpload?.(uploadRes.url);
        if (!addToBoard) return;
        importMeta({ t, lang, type: "upload", metaData: { ...uploadRes, isDrag: false } });
      }}>
      {children}
    </Upload>
  );
};

export default observer(ImageUploader);
