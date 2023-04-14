import JSZip from "jszip";

import { Graph, INode, Lang, download, toJsonBlob } from "@noli/core";
import { translate } from "@noli/business";

import type { DownloadFormat, IToast } from "@/schema/misc";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { useCurrentFullProject } from "./manageProjects";
import { Exporter } from "./export";

export function downloadCurrentFullProject(t: IToast, lang: Lang): void {
  const fullProject = useCurrentFullProject();
  toast(t, "info", translate(Toast_Words["downloading-project-message"], lang));
  const blob = toJsonBlob(fullProject);
  download(blob, `${fullProject.name}.noli`);
}

export async function downloadNodes(
  t: IToast,
  lang: Lang,
  nodes: INode[],
  format: DownloadFormat,
  exportOriginalSize: boolean,
): Promise<void> {
  toast(t, "info", translate(Toast_Words["downloading-nodes-message"], lang));
  if (format === "NOLI") {
    const graph = Graph.fromNodes(nodes);
    await download(toJsonBlob(graph.toJsonInfo()), "exported.noli");
  } else {
    const blobs = await Promise.all(
      nodes.map((node) => Exporter.exportOne(t, lang, node, format, exportOriginalSize)),
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
