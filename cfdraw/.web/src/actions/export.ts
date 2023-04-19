import { INode, ISingleNode, Lang, toJsonBlob } from "@carefree0910/core";
import { ExportBlobOptions, exportBlob, exportNodes } from "@carefree0910/svg";
import { translate } from "@carefree0910/business";

import type { DownloadFormat, IToast, ImageFormat } from "@/schema/misc";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";
import { uploadImage } from "./uploadImage";

const isImage = (format: DownloadFormat) => format === "JPG" || format === "PNG";

function fetchImage(data: { url: string; jpeg: boolean }): Promise<Blob> {
  return Requests.postJson<Blob>("_python", "/fetch_image", data, "blob");
}

export type IExportBlob = ExportBlobOptions & { t: IToast; lang: Lang };
export class Exporter {
  static async exportBlob(
    nodes: ISingleNode[],
    { t, lang, ...others }: IExportBlob,
  ): Promise<Blob | void> {
    return exportBlob(nodes, {
      failedCallback: async () =>
        toast(t, "error", translate(Toast_Words["export-blob-error-message"], lang)),
      ...others,
    });
  }

  static async exportOne(
    t: IToast,
    lang: Lang,
    node: INode,
    format: ImageFormat,
    exportOriginalSize: boolean,
  ): Promise<Blob | void> {
    const jpeg = format === "JPG";
    if (isImage(format) && node.type === "image" && exportOriginalSize) {
      return fetchImage({ url: node.renderParams.src, jpeg });
    }
    const bounding = node.bbox.bounding.toAABB();
    const targetNodes = node.type === "group" ? node.allChildrenNodes : [node];
    if (isImage(format)) {
      const blob = await Exporter.exportBlob(targetNodes, {
        t,
        lang,
        exportOptions: { exportBox: bounding },
      });
      if (!blob || format !== "JPG") return blob;
      const res = await uploadImage(t, lang, blob, { failed: async () => void 0 });
      if (!res) return;
      return fetchImage({ url: res.url, jpeg: true });
    }
    const res = await exportNodes(targetNodes, { exportBox: bounding });
    if (!res) {
      toast(t, "error", translate(Toast_Words["export-blob-error-message"], lang));
      return;
    }
    return toJsonBlob(res.svg.svg());
  }
}
