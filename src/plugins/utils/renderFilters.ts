import type { NodeType } from "@noli/core";
import { IResponse } from "@noli/business";

export type NodeConstraints = NodeType | "none" | "anyNode";
export function getNodeFilter(constraint: NodeConstraints): (info?: IResponse) => boolean {
  return (info) => {
    if (constraint === "none") return true;
    if (info?.displayNode && constraint === "anyNode") return true;
    return info?.type === constraint;
  };
}
