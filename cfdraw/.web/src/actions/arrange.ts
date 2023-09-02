import {
  AABB,
  argMin,
  Coordinate,
  Dictionary,
  getCenteredBBox,
  HitTest,
  INode,
  INodes,
  isGroupNode,
  Matrix2DFields,
  range,
  runGroupContext,
  setDefault,
  sortBy,
} from "@carefree0910/core";
import { BoardStore } from "@carefree0910/business";
import { Toast_Words } from "@carefree0910/components";

import { checkMeta, getOriginMeta, IMeta } from "@/schema/meta";
import { toastWord } from "@/utils/toast";

const schedules = {
  easeInOutElastic: (x: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
  },
  easeOutQuad: (x: number): number => {
    return 1 - (1 - x) * (1 - x);
  },
};
type ScheduleType = keyof typeof schedules;

type IAttachTo = { node: INode; delta: Coordinate } | undefined;
type ArrangePack = {
  node: INode;
  resized: AABB;
  origin: IMeta | undefined;
  attachTo: IAttachTo;
};
type AutoArrangeOptions = {
  padding: number;
  numFrame: number;
  trace: boolean;
  schedule: ScheduleType;
  fitContainer: boolean;
};
function getDefaultArrangeOptions(opt?: Partial<AutoArrangeOptions>): AutoArrangeOptions {
  opt ??= {};
  const padding = opt.padding ?? 32;
  const numFrame = opt.numFrame ?? 90;
  const trace = opt.trace ?? true;
  const schedule = opt.schedule ?? "easeInOutElastic";
  const fitContainer = opt.fitContainer ?? false;
  return { padding, numFrame, trace, schedule, fitContainer };
}
function resizeAutoArrangeTargets(
  targets: INode[],
  commonW: number,
): { scale: number; resized: AABB }[] {
  return targets.map((node) =>
    runGroupContext(
      ({ group }) => {
        const bbox = group.bbox;
        const scale = commonW / bbox.w;
        const resized = bbox.scale(scale);
        group.bbox = resized;
        return { scale, resized: resized.toAABB() };
      },
      new INodes([node]),
      { forceGroup: true },
    ),
  );
}
function arrangeWith(packs: ArrangePack[], commonW: number, padding: number): void {
  // construct gallery
  const numColumns = Math.ceil(Math.sqrt(packs.length));
  const heights: number[] = range(0, numColumns);
  const columns: ArrangePack[][] = range(0, numColumns).map(() => []);
  packs.forEach(({ node, resized, origin, attachTo }) => {
    // 如果当前 pack 需要“附着”在某个节点上，就不进入瀑布流的计算
    if (attachTo) return;
    const targetIdx = argMin(heights);
    columns[targetIdx].push({ node, resized, origin, attachTo });
    if (heights[targetIdx] === 0) {
      heights[targetIdx] = resized.h;
    } else {
      heights[targetIdx] += resized.h + padding;
    }
  });
  // permute with gallery
  columns.forEach((column, i) => {
    let cursor = 0;
    column.forEach(({ node, resized }) => {
      const x = i * (commonW + padding);
      const y = cursor;
      node.bbox = node.bbox.move(new Coordinate(x, y).subtract(resized.position));
      cursor += resized.h + padding;
    });
  });
  // permute with `attachTo`
  packs.forEach(({ node, attachTo }) => {
    if (!attachTo) return;
    const centerTarget = attachTo.node.bbox.center.add(attachTo.delta);
    node.bbox = node.bbox.move(centerTarget.subtract(node.bbox.center));
  });
}
async function animateArrangement(
  original: INode[],
  targets: INode[],
  numFrame: number,
  trace: boolean,
  schedule: ScheduleType,
): Promise<void> {
  if (original.every((node, i) => node.bbox.closeTo(targets[i].bbox, { atol: 0.1, rtol: 0.1 }))) {
    toastWord("info", Toast_Words["auto-arrange-no-need-message"]);
    return;
  }

  async function matchBBox(trace: boolean, fields: Dictionary<Matrix2DFields>): Promise<void> {
    await BoardStore.board.executer.executeNoBusiness("matchBBox", { params: { fields } }, trace);
  }

  const scheduleFn = schedules[schedule];
  for (const i of range(0, numFrame)) {
    const fields: Dictionary<Matrix2DFields> = {};
    targets.forEach((node, j) => {
      const r = i / (numFrame - 1);
      fields[node.alias] = original[j].bbox.lerp(node.bbox, scheduleFn(r)).fields;
    });
    await matchBBox(trace && i == numFrame - 1, fields);
  }
}
export function getArrangements(
  nodes: INode[],
  opt?: Partial<AutoArrangeOptions>,
): { original: INode[]; targets: INode[] } {
  const defaultPrefix = "__";

  const { padding, fitContainer } = getDefaultArrangeOptions(opt);
  const original = nodes.map((node) => node.snapshot());
  const targets = original.map((node) => node.snapshot());
  // group & sort
  const packsGroupByKey: Dictionary<ArrangePack[]> = {};
  const groupLatestTimestamps: Dictionary<number> = {};
  const commonW = Math.min(2048, Math.max(...targets.map((node) => node.w)));
  const checkAttachment = (node: INode) => {
    if (node.type !== "path") return undefined;
    const bbox = node.bbox;
    const overlapped = targets.filter(
      (node) => node.type !== "path" && HitTest.test(bbox, node.bbox),
    );
    if (overlapped.length === 0) return undefined;
    if (overlapped.length === 1) return overlapped[0];
    return sortBy(
      overlapped,
      overlapped.map((node) => node.zIndex),
    )[0];
  };
  const checkAttachmentResponses: Dictionary<INode | undefined> = {};
  targets.forEach((node) => (checkAttachmentResponses[node.alias] = checkAttachment(node)));
  const bases = targets.filter((node) => !checkAttachmentResponses[node.alias]);
  const attachToMapping: Dictionary<IAttachTo> = {};
  targets.forEach((node) => {
    const res = checkAttachmentResponses[node.alias];
    attachToMapping[node.alias] = !res
      ? undefined
      : {
          node: res,
          delta: node.bbox.center.subtract(res.bbox.center),
        };
  });
  const resizedAABBs: Dictionary<AABB> = {};
  const basesResizedRes = resizeAutoArrangeTargets(bases, commonW);
  basesResizedRes.forEach((res, i) => (resizedAABBs[bases[i].alias] = res.resized));
  const scales: Dictionary<number> = {};
  bases.forEach((node, i) => (scales[node.alias] = basesResizedRes[i].scale));
  targets.forEach((node) => {
    const attachTo = attachToMapping[node.alias];
    if (!attachTo) return;
    resizeAutoArrangeTargets([node], node.w * scales[attachTo.node.alias]);
  });
  targets.forEach((node) => {
    const meta = isGroupNode(node) ? undefined : node.meta;
    let key, origin;
    if (!checkMeta(meta)) {
      key = `${defaultPrefix}${node.alias.split(".").slice(0, -1).join(".")}`;
      origin = undefined;
    } else {
      origin = getOriginMeta(meta);
      key = !origin ? defaultPrefix : origin.data.elapsedTimes?.endTime?.toString() ?? "";
    }
    const packs = setDefault(packsGroupByKey, key, []);
    packs.push({
      node,
      resized: resizedAABBs[node.alias],
      origin,
      attachTo: attachToMapping[node.alias],
    });
    groupLatestTimestamps[key] = Math.max(
      meta?.data?.elapsedTimes?.endTime ?? 0,
      groupLatestTimestamps[key] ?? 0,
    );
  });

  const allSortedPacks: ArrangePack[] = [];
  const allKeys = Object.keys(packsGroupByKey);
  const sortedKeys = sortBy(
    allKeys,
    allKeys.map((key) => (key.startsWith(defaultPrefix) ? 0 : groupLatestTimestamps[key])),
  );
  sortedKeys.forEach((key) => {
    const packs = packsGroupByKey[key];
    const sortedPacks = sortBy(
      packs,
      packs.map(({ origin }) => origin?.data.elapsedTimes?.endTime ?? 0),
    );
    sortedPacks.forEach((pack) => allSortedPacks.push(pack));
  });
  // arrange to grid
  arrangeWith(allSortedPacks, commonW, padding);
  // align to center
  runGroupContext(
    ({ group }) => {
      const aabb = group.bbox.bounding.toAABB();
      const { w, h } = aabb;
      let bounding;
      if (fitContainer) {
        bounding = BoardStore.board.screen;
      } else {
        const center = runGroupContext(({ group }) => group.bbox.center, new INodes(original));
        const { x, y } = center.subtract(aabb.center);
        bounding = new AABB(x, y, w, h);
      }
      const centered = getCenteredBBox(w, h, bounding);
      group.bbox = centered;
    },
    new INodes(targets),
    { forceGroup: true },
  );

  return { original, targets };
}
export async function autoArrange(
  nodes: INode[],
  opt?: Partial<AutoArrangeOptions>,
): Promise<void> {
  const { original, targets } = getArrangements(nodes, opt);
  const { numFrame, trace, schedule } = getDefaultArrangeOptions(opt);
  animateArrangement(original, targets, numFrame, trace, schedule);
}
export function onArrange({ type, nodes }: { type: "none" | "multiple"; nodes: INode[] }): void {
  autoArrange(type === "none" ? BoardStore.graph.rootNodes.filter((node) => !node.noSave) : nodes, {
    fitContainer: type === "none",
  });
}
