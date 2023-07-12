import { INode, isGroupNode, toJsonBlob, Requests } from "@carefree0910/core";
import { ExportBlobOptions, exportBlob, exportNodes } from "@carefree0910/svg";

import type { DownloadFormat, ImageFormat } from "@/schema/misc";
import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { uploadImage } from "./uploadImage";

const isImage = (format: DownloadFormat) => format === "JPG" || format === "PNG";

function fetchImage(data: { url: string; jpeg: boolean }): Promise<Blob> {
  return Requests.postJson<Blob>("_python", "/fetch_image", data, "blob");
}

export class Exporter {
  static async exportBlob(nodes: INode[], opt: ExportBlobOptions): Promise<Blob | void> {
    return exportBlob(nodes, {
      failedCallback: async () => toastWord("error", Toast_Words["export-blob-error-message"]),
      ...opt,
    });
  }

  static async exportOne(
    node: INode,
    format: ImageFormat,
    exportOriginalSize: boolean,
  ): Promise<Blob | void> {
    const jpeg = format === "JPG";
    if (isImage(format) && node.type === "image" && exportOriginalSize) {
      return fetchImage({ url: node.renderParams.src, jpeg });
    }
    const bounding = node.bbox.bounding.toAABB();
    const targetNodes = isGroupNode(node) ? node.allRenderChildrenNodes : [node];
    if (isImage(format)) {
      const blob = await Exporter.exportBlob(targetNodes, {
        exportOptions: { exportBox: bounding },
      });
      if (!blob || format !== "JPG") return blob;
      const res = await uploadImage(blob, { failed: async () => void 0 });
      if (!res) return;
      return fetchImage({ url: res.url, jpeg: true });
    }
    const res = await exportNodes(targetNodes, { exportBox: bounding });
    if (!res) {
      toastWord("error", Toast_Words["export-blob-error-message"]);
      return;
    }
    return toJsonBlob(res.svg.svg());
  }
}
