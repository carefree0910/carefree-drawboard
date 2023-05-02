import type { ChakraComponent } from "@chakra-ui/react";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { Coordinate, getRandomHash, INodes, PivotType, shallowCopy } from "@carefree0910/core";
import {
  boardBBoxToDom,
  injectNodeTransformEventCallback,
  removeNodeTransformEventCallback,
  useBoardContainerLeftTop,
  useBoardContainerWH,
  useIsReady,
  useSelectHooks,
  useSelecting,
} from "@carefree0910/business";

import type { IExpandPositionInfo, IRender } from "@/schema/plugins";
import { DEFAULT_PLUGIN_SETTINGS } from "@/utils/constants";
import { usePluginGroupIsExpanded, usePluginIsExpanded } from "@/stores/pluginExpanded";
import { setPluginNeedRender, usePluginNeedRender } from "@/stores/pluginNeedRender";
import { hashInfo, useNodeFilter } from "../utils/renderFilters";
import Floating, { getExpandId } from "./Floating";

let DEBUG_PREFIX: string | undefined;

function getExpandPosition(
  isModal: boolean,
  {
    x,
    y,
    groupId,
    w,
    h,
    iconW,
    iconH,
    pivot,
    follow,
    expandOffsetX,
    expandOffsetY,
  }: { x: number; y: number; groupId?: string } & IExpandPositionInfo,
): Coordinate {
  // check group
  if (!!groupId) {
    const group = document.getElementById(groupId);
    if (group) {
      const rect = group.getBoundingClientRect();
      x = rect.left;
      y = rect.top;
      iconW = rect.width;
      iconH = rect.height;
    }
  }
  // check modal
  if (isModal) {
    pivot = "center";
    const { w: bw, h: bh } = useBoardContainerWH();
    const { x: left, y: top } = useBoardContainerLeftTop();
    x = left + 0.5 * (bw - iconW);
    y = top + 0.5 * (bh - h) - iconH;
  }
  // x
  if (["top", "center", "bottom"].includes(pivot)) {
    x += 0.5 * (iconW - w) + expandOffsetX;
  } else if (["rt", "right", "rb"].includes(pivot)) {
    if (follow) {
      x += iconW + expandOffsetX;
    } else {
      x += expandOffsetX - w;
    }
  } else {
    if (follow) {
      x += expandOffsetX - w;
    } else {
      x += iconW + expandOffsetX;
    }
  }
  // y
  if (["left", "right"].includes(pivot)) {
    y += 0.5 * (iconH - h) + expandOffsetY;
  } else if (pivot === "center") {
    y += iconH + expandOffsetY;
  } else {
    if (!follow) {
      if (["lb", "bottom", "rb"].includes(pivot)) {
        y += expandOffsetY - h;
      } else if (["lt", "top", "rt"].includes(pivot)) {
        y += iconH + expandOffsetY;
      }
    } else {
      if (pivot === "bottom") {
        y += iconH + expandOffsetY;
      } else if (pivot === "top") {
        y += expandOffsetY - h;
      } else if (["lb", "rb"].includes(pivot)) {
        y += expandOffsetY + iconH - h;
      } else if (["lt", "rt"].includes(pivot)) {
        y += expandOffsetY;
      }
    }
  }
  // return
  return new Coordinate(x, y);
}

const Render = (({
  id,
  groupId,
  nodeConstraint,
  nodeConstraintRules,
  nodeConstraintValidator,
  renderInfo,
  containerRef,
  children,
  ...props
}: IRender) => {
  const _id = useMemo(() => id ?? `plugin_${getRandomHash()}`, [id]);
  const info = useSelecting("raw");
  const isReady = useIsReady();
  const expand = usePluginIsExpanded(_id);
  const groupExpand = usePluginGroupIsExpanded(groupId);
  const needRender = usePluginNeedRender(_id);
  const renderFilter = useNodeFilter({
    nodeConstraint,
    nodeConstraintRules,
    nodeConstraintValidator,
  });
  useEffect(() => {
    let latest = true;
    renderFilter(info).then((filter) => {
      if (!latest) return;
      if (!filter) {
        setPluginNeedRender(_id, false);
      } else if (!!groupId && !groupExpand && !expand) {
        setPluginNeedRender(_id, false);
      } else {
        setPluginNeedRender(_id, true);
      }
    });
    return () => {
      latest = false;
    };
  }, [_id, groupId, expand, groupExpand, hashInfo(info), nodeConstraint, nodeConstraintRules]);
  let { w, h, iconW, iconH, pivot, follow, offsetX, offsetY, expandOffsetX, expandOffsetY } =
    renderInfo;
  iconW ??= DEFAULT_PLUGIN_SETTINGS.iconW;
  iconH ??= DEFAULT_PLUGIN_SETTINGS.iconH;
  pivot ??= DEFAULT_PLUGIN_SETTINGS.pivot as PivotType;
  follow ??= DEFAULT_PLUGIN_SETTINGS.follow;
  follow = follow || !!groupId;
  expandOffsetX ??=
    renderInfo.useModal || ["top", "center", "bottom"].includes(pivot)
      ? 0
      : ["lt", "left", "lb"].includes(pivot) === follow
      ? -DEFAULT_PLUGIN_SETTINGS.expandOffsetX
      : DEFAULT_PLUGIN_SETTINGS.expandOffsetX;
  expandOffsetY ??=
    renderInfo.useModal || ["left", "right", "lt", "rt", "lb", "rb"].includes(pivot)
      ? 0
      : pivot === "center"
      ? DEFAULT_PLUGIN_SETTINGS.expandOffsetY
      : (pivot === "top") === follow
      ? -DEFAULT_PLUGIN_SETTINGS.expandOffsetY
      : DEFAULT_PLUGIN_SETTINGS.expandOffsetY;

  const updatedRenderInfo = {
    ...renderInfo,
    w,
    h,
    iconW,
    iconH,
    pivot,
    follow,
    expandOffsetX,
    expandOffsetY,
  };

  const deps = [
    _id,
    expand,
    groupExpand,
    isReady,
    needRender,
    hashInfo(info),
    groupId,
    iconW,
    iconH,
    nodeConstraint,
    nodeConstraintRules,
    nodeConstraintValidator,
    pivot,
    follow,
    offsetX,
    offsetY,
    expandOffsetX,
    expandOffsetY,
    JSON.stringify(props),
  ];

  const updateFloating = useCallback(async (e: any) => {
    if (!needRender) return;
    const _iconW = iconW!;
    const _iconH = iconH!;
    const _pivot = pivot!;
    const _follow = follow!;
    const _offsetX =
      offsetX ??
      (["top", "center", "bottom"].includes(_pivot)
        ? 0
        : ["lt", "left", "lb"].includes(_pivot) === _follow
        ? -DEFAULT_PLUGIN_SETTINGS.offsetX
        : DEFAULT_PLUGIN_SETTINGS.offsetX);
    const _offsetY =
      offsetY ??
      (["left", "center", "right"].includes(_pivot)
        ? 0
        : ["lt", "top", "rt"].includes(_pivot) === _follow
        ? -DEFAULT_PLUGIN_SETTINGS.offsetY
        : DEFAULT_PLUGIN_SETTINGS.offsetY);
    // adjust floating
    const domFloating = document.querySelector<HTMLDivElement>(`#${_id}`);
    if (!domFloating) return;
    let x, y;
    if (!_follow) {
      const { x: left, y: top } = useBoardContainerLeftTop();
      const { w: bw, h: bh } = useBoardContainerWH();
      // x
      if (["lt", "left", "lb"].includes(_pivot)) {
        x = left + _offsetX;
      } else if (["rt", "right", "rb"].includes(_pivot)) {
        x = left + bw - _iconW + _offsetX;
      } else {
        x = left + 0.5 * (bw - _iconW) + _offsetX;
      }
      // y
      if (["lt", "top", "rt"].includes(_pivot)) {
        y = top + _offsetY;
      } else if (["lb", "bottom", "rb"].includes(_pivot)) {
        y = top + bh - _iconH + _offsetY;
      } else {
        y = top + 0.5 * (bh - _iconH) + _offsetY;
      }
    } else {
      let domPivot;
      if (!!groupId) {
        domPivot = Coordinate.origin();
      } else {
        if (DEBUG_PREFIX && _id.startsWith(DEBUG_PREFIX)) {
          console.log("> e", e);
          console.log("> info", _id, shallowCopy(info));
        }
        const bounding = info.displayNode
          ? info.displayNode.bbox.bounding
          : new INodes(info.nodes).bbox;
        domPivot = boardBBoxToDom(bounding).pivot(_pivot);
      }
      let offsetX, offsetY;
      // x
      if (!!groupId) {
        offsetX = _offsetX;
      } else if (["lt", "left", "lb"].includes(_pivot)) {
        offsetX = -_iconW + _offsetX;
      } else if (["rt", "right", "rb"].includes(_pivot)) {
        offsetX = _offsetX;
      } else {
        offsetX = -0.5 * _iconW + _offsetX;
      }
      // y
      if (!!groupId) {
        offsetY = _offsetY;
      } else if (["lt", "top", "rt"].includes(_pivot)) {
        offsetY = -_iconH + _offsetY;
      } else if (["lb", "bottom", "rb"].includes(_pivot)) {
        offsetY = _offsetY;
      } else {
        offsetY = -0.5 * _iconH + _offsetY;
      }
      ({ x, y } = domPivot.add(new Coordinate(offsetX, offsetY)));
    }
    domFloating.style.transform = `matrix(1,0,0,1,${x},${y})`;
    // adjust expand of the floating
    const domFloatingExpand = document.querySelector<HTMLDivElement>(`#${getExpandId(_id)}`);
    if (!domFloatingExpand) return;
    const { x: ex, y: ey } = getExpandPosition(updatedRenderInfo.useModal ?? false, {
      x,
      y,
      groupId,
      w,
      h,
      iconW: _iconW,
      iconH: _iconH,
      pivot: _pivot,
      follow: _follow,
      expandOffsetX: expandOffsetX!,
      expandOffsetY: expandOffsetY!,
    });
    domFloatingExpand.style.transform = `matrix(1,0,0,1,${ex},${ey})`;
  }, deps);

  // This effect handles callbacks that dynamically render the plugin's position
  useLayoutEffect(() => {
    if (!needRender) return;
    if (!!groupId && !groupExpand) return;

    if (expand || groupExpand) {
      updateFloating({ event: "expand" });
    }
    injectNodeTransformEventCallback(_id, updateFloating);
    useSelectHooks().register({ key: _id, after: updateFloating });
    window.addEventListener("resize", updateFloating);
    if (isReady) {
      updateFloating({ event: "init" });
    }

    return () => {
      if (DEBUG_PREFIX && _id.startsWith(DEBUG_PREFIX)) {
        console.log(">>>>> clean up");
      }
      removeNodeTransformEventCallback(_id);
      useSelectHooks().remove(_id);
      window.removeEventListener("resize", updateFloating);
    };
  }, [...deps]);

  if (!needRender) return null;

  return (
    <Floating
      id={_id}
      groupId={groupId}
      ref={containerRef}
      renderInfo={updatedRenderInfo}
      {...props}>
      {children}
    </Floating>
  );
}) as ChakraComponent<"div", {}>;

export default observer(Render);
