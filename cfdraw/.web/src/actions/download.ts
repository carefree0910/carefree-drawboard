import JSZip from "jszip";

import { Graph, INode, download, toJsonBlob } from "@carefree0910/core";

import type { DownloadFormat } from "@/schema/misc";
import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { useCurrentProjectWithUserId } from "./manageProjects";
import { Exporter } from "./export";

export function downloadCurrentFullProject(): void {
  const projectWithUserId = useCurrentProjectWithUserId();
  toastWord("info", Toast_Words["downloading-project-message"]);
  const blob = toJsonBlob(projectWithUserId);
  download(blob, `${projectWithUserId.name}.cfdraw`);
}

export async function downloadNodes(
  nodes: INode[],
  format: DownloadFormat,
  exportOriginalSize: boolean,
): Promise<void> {
  toastWord("info", Toast_Words["downloading-nodes-message"]);
  if (format === "NOLI") {
    const graph = Graph.fromNodes(nodes);
    await download(toJsonBlob(graph.toJsonInfo()), "exported.noli");
  } else {
    const blobs = await Promise.all(
      nodes.map((node) => Exporter.exportOne(node, format, exportOriginalSize)),
    );
    const valid = blobs
      .map((blob, i) => ({ blob, node: nodes[i] }))
      .filter(({ blob }) => !!blob) as { blob: Blob; node: INode }[];
    if (valid.length === 0) return;
    const appendix = format.toLowerCase();
    if (valid.length === 1) {
      await download(valid[0].blob, `exported.${appendix}`);
    } else {
      const zip = new JSZip();
      valid.forEach(({ blob }, i) => zip.file(`${i}.${appendix}`, blob, { binary: true }));
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 1 },
      });
      await download(content, "exported.zip");
    }
  }
}
