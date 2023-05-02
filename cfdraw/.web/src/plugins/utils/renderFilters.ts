import { useCallback } from "react";

import type { IResponse } from "@carefree0910/business";
import { Dictionary, Logger, getHash, isUndefined, waitUntil } from "@carefree0910/core";

import type { IPythonSocketMessage, IPythonSocketRequest } from "@/schema/_python";
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
async function checkRules(
  rules: NodeConstraintSettings["nodeConstraintRules"],
  info?: IResponse,
): Promise<boolean> {
  if (rules?.some) {
    for (const nodeConstraint of rules.some) {
      if (await useNodeFilter({ nodeConstraint })(info)) return true;
    }
    return false;
  }
  if (rules?.every) {
    for (const nodeConstraint of rules.every) {
      if (!(await useNodeFilter({ nodeConstraint })(info))) return false;
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
const working: Dictionary<boolean> = {};
const results: Dictionary<boolean> = {};
const clear = (hash: string) => {
  setTimeout(() => {
    delete results[hash];
  }, 60 * 1000);
};
function checkValidator(validator?: string, info?: IResponse): Promise<boolean> {
  if (isUndefined(validator)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const hash = hashInfo(info);
    if (!isUndefined(results[hash])) return resolve(results[hash]);
    if (working[hash]) {
      return waitUntil(() => !isUndefined(results[hash])).then(() => resolve(results[hash]));
    }
    working[hash] = true;
    const getMessage = (): Promise<IPythonSocketRequest> => {
      return getPythonRequest({
        node: info?.displayNode ?? null,
        nodes: info?.nodes ?? [],
        identifier: "node_validator",
      }).then((data) => ({
        ...data,
        hash,
        extraData: { key: validator },
        isInternal: true,
      }));
    };
    const onMessage = async ({
      status,
      message,
      data: { final },
    }: IPythonSocketMessage<IValidatorResponse>) => {
      delete working[hash];
      if (status === "finished" && final) {
        results[hash] = final.acceptable;
        clear(hash);
        resolve(final.acceptable);
      } else if (status === "exception") {
        Logger.warn(`execute node validator ${validator} failed: ${message}`);
        resolve(false);
      }
      return {};
    };

    runOneTimeSocketHook({
      key: hash,
      getMessage,
      onMessage,
      isInternal: true,
    });
  });
}
export function useConstraintDeps(settings: NodeConstraintSettings) {
  return [settings.nodeConstraint, settings.nodeConstraintRules, settings.nodeConstraintValidator];
}
export function useNodeFilter(
  settings: NodeConstraintSettings,
): (info?: IResponse) => Promise<boolean> {
  return useCallback(async (info) => {
    if (!checkConstraint(settings.nodeConstraint, info)) return false;
    if (!(await checkRules(settings.nodeConstraintRules, info))) return false;
    if (!(await checkValidator(settings.nodeConstraintValidator, info))) return false;
    return true;
  }, useConstraintDeps(settings));
}
