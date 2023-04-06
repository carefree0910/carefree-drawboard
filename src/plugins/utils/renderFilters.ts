import type { NodeType } from "@noli/core";
import { IResponse } from "@noli/business";

export type NodeConstraints = NodeType | "none" | "anyNode" | "singleNode" | "multiNode";
export function getNodeFilter(constraint: NodeConstraints): (info?: IResponse) => boolean {
  return (info) => {
    if (constraint === "none") return true;
    if (!info) return false;
    if (constraint === "anyNode") return info.type !== "multiple";
    if (constraint === "multiNode") return info.type === "multiple";
    if (constraint === "singleNode") return !["group", "multiple", "none"].includes(info.type);
    return info.type === constraint;
  };
}
