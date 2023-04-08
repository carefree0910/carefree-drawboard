import { useMemo, useLayoutEffect } from "react";
import { observer } from "mobx-react-lite";

import { Coordinate, getRandomHash, PivotType } from "@noli/core";
import {
  boardBBoxToDom,
  injectNodeTransformEventCallback,
  removeNodeTransformEventCallback,
  useBoardContainerLeftTop,
  useBoardContainerWH,
  useSelectHooks,
  useSelecting,
} from "@noli/business";

import type { IRender } from "@/types/plugins";
import { DEFAULT_PLUGIN_SETTINGS } from "@/utils/constants";
import { getNodeFilter } from "../utils/renderFilters";
import Floating, {
  floatingEvent,
  getExpandId,
  getExpandPosition,
  IFloatingEvent,
} from "./Floating";

const Render = ({
  iconW,
  iconH,
  nodeConstraint,
  pivot,
  follow,
  offsetX,
  offsetY,
  expandOffsetX,
  expandOffsetY,
  children,
  ...props
}: IRender) => {
  const id = useMemo(() => `plugin_${getRandomHash()}`, []);
  iconW ??= DEFAULT_PLUGIN_SETTINGS.iconW;
  iconH ??= DEFAULT_PLUGIN_SETTINGS.iconH;
  pivot ??= DEFAULT_PLUGIN_SETTINGS.pivot as PivotType;
  follow ??= DEFAULT_PLUGIN_SETTINGS.follow;
  expandOffsetX ??=
    props.useModal || ["top", "center", "bottom"].includes(pivot)
      ? 0
      : DEFAULT_PLUGIN_SETTINGS.expandOffsetX;
  expandOffsetY ??=
    props.useModal || ["left", "right"].includes(pivot) ? 0 : DEFAULT_PLUGIN_SETTINGS.expandOffsetY;

  // This effect handles callbacks that dynamically render the plugin's position
  useLayoutEffect(() => {
    const updateFloating = async () => {
      const _iconW = iconW!;
      const _iconH = iconH!;
      const _pivot = pivot!;
      const _follow = follow!;
      const _offsetX =
        offsetX ??
        (["top", "center", "bottom"].includes(_pivot) ? 0 : DEFAULT_PLUGIN_SETTINGS.offsetX);
      const _offsetY =
        offsetY ??
        (["left", "center", "right"].includes(_pivot) ? 0 : DEFAULT_PLUGIN_SETTINGS.offsetY);
      // adjust floating
      const domFloating = document.querySelector<HTMLDivElement>(`#${id}`);
      if (!domFloating) return;
      let x, y;
      if (!_follow) {
        const { x: left, y: top } = useBoardContainerLeftTop();
        const { w: bw, h: bh } = useBoardContainerWH();
        // x
        if (["lt", "left", "lb"].includes(_pivot)) {
          x = left + _offsetX;
        } else if (["rt", "right", "rb"].includes(_pivot)) {
          x = left + bw - _iconW - _offsetX;
        } else {
          x = left + 0.5 * (bw - _iconW) + _offsetX;
        }
        // y
        if (["lt", "top", "rt"].includes(_pivot)) {
          y = top + _offsetY;
        } else if (["lb", "bottom", "rb"].includes(_pivot)) {
          y = top + bh - _iconH - _offsetY;
        } else {
          y = top + 0.5 * (bh - _iconH) + _offsetY;
        }
      } else {
        const info = useSelecting("basic")({ fixed: 0 });
        if (!info || !info.displayNode || (props.renderFilter && !props.renderFilter(info))) {
          return;
        }
        const domPivot = boardBBoxToDom(info.displayNode.bbox.bounding).pivot(_pivot);
        let offsetX, offsetY;
        // x
        if (["lt", "left", "lb"].includes(_pivot)) {
          offsetX = -_iconW - _offsetX;
        } else if (["rt", "right", "rb"].includes(_pivot)) {
          offsetX = _offsetX;
        } else {
          offsetX = -0.5 * _iconW + _offsetX;
        }
        // y
        if (["lt", "top", "rt"].includes(_pivot)) {
          offsetY = -_iconH - _offsetY;
        } else if (["lb", "bottom", "rb"].includes(_pivot)) {
          offsetY = _offsetY;
        } else {
          offsetY = -0.5 * _iconH + _offsetY;
        }
        ({ x, y } = domPivot.add(new Coordinate(offsetX, offsetY)));
      }
      domFloating.dataset.x = x.toString();
      domFloating.dataset.y = y.toString();
      domFloating.style.transform = `matrix(1,0,0,1,${x},${y})`;
      // adjust expand of the floating
      const domFloatingExpand = document.querySelector<HTMLDivElement>(`#${getExpandId(id)}`);
      if (!domFloatingExpand) return;
      const { x: ex, y: ey } = getExpandPosition(props.useModal ?? false, {
        x,
        y,
        w: props.w,
        h: props.h,
        iconW: _iconW,
        iconH: _iconH,
        pivot: _pivot,
        follow: _follow,
        expandOffsetX: expandOffsetX!,
        expandOffsetY: expandOffsetY!,
      });
      domFloatingExpand.style.transform = `matrix(1,0,0,1,${ex},${ey})`;
    };
    const onFloatingReRender = ({ id: renderedId, needRender }: IFloatingEvent) => {
      if (id === renderedId && needRender) {
        updateFloating();
      }
    };
    floatingEvent.on(onFloatingReRender);
    injectNodeTransformEventCallback(id, updateFloating);
    useSelectHooks().register({ key: id, after: updateFloating });
    window.addEventListener("resize", updateFloating);
    updateFloating();

    return () => {
      removeNodeTransformEventCallback(id);
      useSelectHooks().remove(id);
      window.removeEventListener("resize", updateFloating);
    };
  }, [
    iconW,
    iconH,
    nodeConstraint,
    pivot,
    follow,
    offsetX,
    offsetY,
    expandOffsetX,
    expandOffsetY,
    children,
    props,
  ]);

  return (
    <Floating
      id={id}
      iconW={iconW}
      iconH={iconH}
      pivot={pivot}
      follow={follow}
      expandOffsetX={expandOffsetX}
      expandOffsetY={expandOffsetY}
      renderFilter={getNodeFilter(nodeConstraint)}
      {...props}>
      {children}
    </Floating>
  );
};

export default observer(Render);