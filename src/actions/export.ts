import { INode, ISingleNode, Lang, toJsonBlob } from "@noli/core";
import { ExportBlobOptions, exportBlob, exportNodes } from "@noli/svg";
import { translate } from "@noli/business";

import type { DownloadFormat, IToast, ImageFormat } from "@/schema/misc";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { uploadImage } from "./uploadImage";

const isImage = (format: DownloadFormat) => format === "JPG" || format === "PNG";
const toJpegUrl = (url: string) => `${url}?jpeg=True`;

export class Exporter {
  static async exportBlob(
    nodes: ISingleNode[],
    { t, lang, ...others }: ExportBlobOptions & { t: IToast; lang: Lang },
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
    if (isImage(format) && node.type === "image" && exportOriginalSize) {
      let url = node.renderParams.src;
      if (format === "JPG") {
        url = toJpegUrl(url);
      }
      return fetch(url).then((res) => res.blob());
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
      return fetch(toJpegUrl(res.url)).then((res) => res.blob());
    }
    const res = await exportNodes(targetNodes, { exportBox: bounding });
    if (!res) {
      toast(t, "error", translate(Toast_Words["export-blob-error-message"], lang));
      return;
    }
    return toJsonBlob(res.svg.svg());
  }
}