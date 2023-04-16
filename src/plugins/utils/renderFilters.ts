import { IResponse } from "@carefree0910/business";

import type { NodeConstraints } from "@/schema/plugins";

export function getNodeFilter(constraint: NodeConstraints): (info?: IResponse) => boolean {
  return (info) => {
    if (constraint === "none") return true;
    if (!info) return false;
    if (constraint === "anyNode") return info.type !== "none";
    if (constraint === "multiNode") return info.type === "multiple";
    if (constraint === "singleNode") return !["group", "multiple", "none"].includes(info.type);
    return info.type === constraint;
  };
}
