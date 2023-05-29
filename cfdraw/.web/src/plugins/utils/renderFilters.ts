import { useCallback } from "react";

import type { IResponse } from "@carefree0910/business";
import { getHash, isUndefined } from "@carefree0910/core";

import type { IPythonSocketRequest } from "@/schema/_python";
import type { NodeConstraintSettings } from "@/schema/plugins";
import { runOneTimeSocketHook } from "@/stores/socket";
import { getPythonRequest } from "@/hooks/usePython";

function checkConstraint(
  constraint: NodeConstraintSettings["nodeConstraint"],
  info?: IResponse,
): boolean {
  if (!constraint || constraint === "none") return true;
  if (!info) return false;
  if (constraint === "anyNode") return info.type !== "none";
  if (constraint === "multiNode") return info.type === "multiple";
  if (constraint === "singleNode") return !["group", "multiple", "none"].includes(info.type);
  return info.type === constraint;
}
function checkRules(
  rules: NodeConstraintSettings["nodeConstraintRules"],
  info?: IResponse,
): boolean {
  if (rules?.some) {
    for (const nodeConstraint of rules.some) {
      if (checkConstraint(nodeConstraint, info)) return true;
    }
    return false;
  }
  if (rules?.every) {
    for (const nodeConstraint of rules.every) {
      if (!checkConstraint(nodeConstraint, info)) return false;
    }
    return true;
  }
  if (rules?.exactly) {
    if (!info) return false;
    if (info.nodes.length !== rules.exactly.length) return false;
    const selectedNodes = info.nodes.map((node) => node.type);
    for (const nodeConstraint of rules.exactly) {
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
  return true;
}
interface IValidatorResponse {
  acceptable: boolean;
}
export function hashInfo(info?: IResponse): string {
  if (!info) return "";
  const node = info.displayNode?.alias ?? "";
  const nodes = info.nodes.map((node) => node.alias).join(",");
  return getHash(`${node}-${nodes}`).toString();
}
function checkValidator(validator?: string, info?: IResponse): Promise<boolean> {
  if (isUndefined(validator)) return Promise.resolve(true);
  const hash = `${validator}-${hashInfo(info)}`;
  const getMessage = (): Promise<IPythonSocketRequest> => {
    return getPythonRequest({
      node: info?.displayNode ?? null,
      nodes: info?.nodes ?? [],
      identifier: "node_validator",
      opt: { noExport: true },
      needExportNodeData: true,
    }).then((data) => ({
      ...data,
      hash,
      extraData: { key: validator },
      isInternal: true,
    }));
  };

  return runOneTimeSocketHook<IValidatorResponse>({
    key: "checkValidator",
    hook: {
      key: hash,
      getMessage,
      isInternal: true,
    },
    timeout: 10 * 1000,
  }).then((res) => res?.acceptable ?? false);
}
export function useConstraintDeps(settings: NodeConstraintSettings) {
  return [settings.nodeConstraint, settings.nodeConstraintRules, settings.nodeConstraintValidator];
}
export function useNodeFilter(
  settings: NodeConstraintSettings,
): (info?: IResponse) => Promise<boolean> {
  return useCallback(async (info) => {
    if (!checkConstraint(settings.nodeConstraint, info)) return false;
    if (!checkRules(settings.nodeConstraintRules, info)) return false;
    if (!(await checkValidator(settings.nodeConstraintValidator, info))) return false;
    return true;
  }, useConstraintDeps(settings));
}

export function checkHasConstraint({
  nodeConstraint,
  nodeConstraintRules,
  nodeConstraintValidator,
}: NodeConstraintSettings): boolean {
  if (nodeConstraint && nodeConstraint !== "none") return true;
  if (nodeConstraintRules?.some) return true;
  if (nodeConstraintRules?.every) return true;
  if (nodeConstraintRules?.exactly) return true;
  if (!isUndefined(nodeConstraintValidator)) return true;
  return false;
}
