import type { NodeType } from "@noli/core";
import { IResponse } from "@noli/business";

export type TargetNodeType = NodeType | "all";
export function getNodeFilter(type: TargetNodeType): (info?: IResponse) => boolean {
  return (info) => {
    if (type === "all") return true;
    return info?.type === type;
  };
}
