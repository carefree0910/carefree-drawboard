import { Graph } from "@carefree0910/core";

import { IMAGE_PLACEHOLDER } from "@/utils/constants";

export function cleanGraph(graph: Graph): void {
  graph.allSingleNodes.forEach((node) => {
    if (node.type === "image") {
      node.renderParams.placeholder = IMAGE_PLACEHOLDER;
    }
  });
}
