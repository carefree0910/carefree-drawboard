import { useMemo, useLayoutEffect } from "react";
import { observer } from "mobx-react-lite";

import { Coordinate, getRandomHash, PivotType } from "@noli/core";
import {
  boardBBoxToDom,
  BoardStore,
  injectNodeTransformEventCallback,
  removeNodeTransformEventCallback,
  useBoardContainerLeftTop,
  useSelectHooks,
  useSelecting,
} from "@noli/business";

import { getNodeFilter, TargetNodeType } from "./renderFilters";
import Floating, { floatingEvent, IFloating, IFloatingEvent } from "@/components/Floating";

export interface IRender extends Omit<IFloating, "id" | "iconW" | "iconH" | "pivot"> {
  targetNodeType: TargetNodeType;
  pivot?: PivotType;
  follow?: boolean;
  paddingX?: number;
  paddingY?: number;
  iconW?: number;
  iconH?: number;
}

const Render = ({
  iconW,
  iconH,
  targetNodeType,
  pivot,
  follow,
  paddingX,
  paddingY,
  children,
  ...props
}: IRender) => {
  const id = useMemo(() => `plugin_${getRandomHash()}`, []);
  iconW ??= 48;
  iconH ??= 48;
  pivot ??= "bottom";

  /**
   * This effect handles callbacks that dynamically render the plugin's position
   *
   * > we use `useLayoutEffect` here and use `useEffect` in `Floating` to make sure
   * the following code is executed before `Floating`'s `useEffect`
   */
  useLayoutEffect(() => {
    const updateFloating = async () => {
      const _pivot = pivot!;
      const _follow = follow ?? false;
      const _paddingX = paddingX ?? 8;
      const _paddingY = paddingY ?? 8;
      const domFloating = document.querySelector<HTMLDivElement>(`#${id}`);
      if (!domFloating) return;
      const isExpand = domFloating.dataset.expand === "true";
      const _w = isExpand ? props.w : iconW!;
      const _h = isExpand ? props.h : iconH!;
      let x, y;
      if (!_follow) {
        const { x: left, y: top } = useBoardContainerLeftTop();
        const { w: bw, h: bh } = BoardStore.board.wh;
        // x
        if (["lt", "left", "lb"].includes(_pivot)) {
          x = left + _paddingX;
        } else if (["rt", "right", "rb"].includes(_pivot)) {
          x = left + bw - _w - _paddingX;
        } else {
          x = left + 0.5 * (bw - _w);
        }
        // y
        if (["lt", "top", "rt"].includes(_pivot)) {
          y = top + _paddingY;
        } else if (["lb", "bottom", "rb"].includes(_pivot)) {
          y = top + bh - _h - _paddingY;
        } else {
          y = top + 0.5 * (bh - _h);
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
          offsetX = -_w - _paddingX;
        } else if (["rt", "right", "rb"].includes(_pivot)) {
          offsetX = _paddingX;
        } else {
          offsetX = -0.5 * _w;
        }
        // y
        if (["lt", "top", "rt"].includes(_pivot)) {
          offsetY = -_h - _paddingY;
        } else if (["lb", "bottom", "rb"].includes(_pivot)) {
          offsetY = _paddingY;
        } else {
          offsetY = -0.5 * _h;
        }
        ({ x, y } = domPivot.add(new Coordinate(offsetX, offsetY)));
      }
      domFloating.dataset.x = x.toString();
      domFloating.dataset.y = y.toString();
      domFloating.style.transform = `matrix(1,0,0,1,${x},${y})`;
    };
    const onFloatingReRender = ({ id: renderedId, needRender }: IFloatingEvent) => {
      if (id === renderedId && needRender) {
        updateFloating();
      }
    };
    floatingEvent.on(onFloatingReRender);
    injectNodeTransformEventCallback(id, updateFloating);
    useSelectHooks().register({ key: id, after: updateFloating });
    updateFloating();

    return () => {
      removeNodeTransformEventCallback(id);
      useSelectHooks().remove(id);
    };
  }, [targetNodeType, pivot, follow, paddingX, paddingY]);

  return (
    <Floating
      id={id}
      iconW={iconW}
      iconH={iconH}
      pivot={pivot}
      renderFilter={getNodeFilter(targetNodeType)}
      {...props}>
      {children}
    </Floating>
  );
};

export default observer(Render);
