import { IResponse } from "@carefree0910/business";

import type { NodeConstraintSettings } from "@/schema/plugins";

export function getNodeFilter({
  nodeConstraint,
  nodeConstraintRules,
}: NodeConstraintSettings): (info?: IResponse) => boolean {
  return (info) => {
    // check rules first
    if (
      nodeConstraintRules?.some &&
      !nodeConstraintRules.some.some((nodeConstraint) => getNodeFilter({ nodeConstraint })(info))
    ) {
      return false;
    }
    if (
      nodeConstraintRules?.every &&
      !nodeConstraintRules.every.every((nodeConstraint) => getNodeFilter({ nodeConstraint })(info))
    ) {
      return false;
    }
    if (nodeConstraintRules?.exactly) {
      if (!info) return false;
      if (info.nodes.length !== nodeConstraintRules.exactly.length) return false;
      const selectedNodes = info.nodes.map((node) => node.type);
      for (const nodeConstraint of nodeConstraintRules.exactly) {
        let searched = false;
        for (let i = 0; i < selectedNodes.length; i++) {
          if (selectedNodes[i] === nodeConstraint) {
            selectedNodes.splice(i, 1);
            searched = true;
            break;
          }
        }
        if (!searched) return false;
      }
    }
    // then check constraint
    if (!nodeConstraint || nodeConstraint === "none") return true;
    if (!info) return false;
    if (nodeConstraint === "anyNode") return info.type !== "none";
    if (nodeConstraint === "multiNode") return info.type === "multiple";
    if (nodeConstraint === "singleNode") return !["group", "multiple", "none"].includes(info.type);
    return info.type === nodeConstraint;
  };
}
