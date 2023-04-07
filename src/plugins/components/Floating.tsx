import { observer } from "mobx-react-lite";
import { useState, useMemo, useLayoutEffect } from "react";
import { Box, BoxProps, Flex, Image } from "@chakra-ui/react";

import { Coordinate } from "@noli/core";
import { BoardStore, useBoardContainerLeftTop, useIsReady, useSelecting } from "@noli/business";

import type { IFloating, IPositionInfo } from "@/types/plugins";
import { Event } from "@/utils/event";
import { themeStore } from "@/stores/theme";
import { VISIBILITY_TRANSITION } from "@/utils/constants";

export interface IFloatingEvent {
  id: string;
  needRender: boolean;
}
export const floatingEvent = new Event<IFloatingEvent>();

export function getExpandId(id: string): string {
  return `${id}_expand`;
}
export function getExpandPosition(
  isModal: boolean,
  {
    x,
    y,
    w,
    h,
    iconW,
    iconH,
    pivot,
    follow,
    expandOffsetX,
    expandOffsetY,
  }: { x: number; y: number } & IPositionInfo,
): Coordinate {
  if (isModal) {
    pivot = "center";
    const { w: bw, h: bh } = BoardStore.board.wh;
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
      x -= w + expandOffsetX;
    }
  } else {
    if (follow) {
      x -= w + expandOffsetX;
    } else {
      x += iconW + expandOffsetX;
    }
  }
  // y
  if (["left", "right"].includes(pivot)) {
    y += 0.5 * (iconH - h) + expandOffsetY;
  } else if (["lb", "bottom", "rb"].includes(pivot)) {
    if (follow) {
      y += iconH + expandOffsetY;
    } else {
      y -= h + expandOffsetY;
    }
  } else if (["lt", "top", "rt"].includes(pivot)) {
    if (follow) {
      y -= h + expandOffsetY;
    } else {
      y += iconH + expandOffsetY;
    }
  } else {
    y += iconH + expandOffsetY;
  }
  // return
  return new Coordinate(x, y);
}

function Floating({
  id,
  src,
  bgOpacity,
  w,
  h,
  iconW,
  iconH,
  pivot,
  follow,
  expandOffsetX,
  expandOffsetY,
  renderFilter,
  useModal,
  modalOpacity,
  isInvisible,
  children,
  ...props
}: IFloating) {
  const needRender = useIsReady() && (!renderFilter || renderFilter(useSelecting("raw")));
  const { panelBg } = themeStore.styles;
  const bgOpacityHex = Math.round((bgOpacity ?? 0.5) * 255).toString(16);
  const commonProps: BoxProps = {
    p: "12px",
    bg: `${panelBg}${bgOpacityHex}`,
    position: "absolute",
    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)",
    borderRadius: "4px",
  };
  const [expand, setExpand] = useState(false);
  const [transform, setTransform] = useState<string | undefined>(undefined);
  const expandId = useMemo(() => getExpandId(id), [id]);
  // convert float to hex
  modalOpacity ??= 0.94117647; // 240; f0
  const modalOpacityHex = Math.round(modalOpacity * 255).toString(16);
  const expandBg = useMemo(
    () => (useModal ? `${panelBg}${modalOpacityHex}` : commonProps.bg),
    [useModal],
  );
  useLayoutEffect(() => floatingEvent.emit({ id, needRender }), [expand, needRender]);

  if (!needRender) return null;

  return (
    <>
      <Box
        as="button"
        id={id}
        w={`${iconW}px`}
        h={`${iconH}px`}
        onClick={() => {
          const self = document.querySelector<HTMLDivElement>(`#${id}`);
          if (self && self.dataset.x && self.dataset.y) {
            let x = parseFloat(self.dataset.x);
            let y = parseFloat(self.dataset.y);
            ({ x, y } = getExpandPosition(useModal ?? false, {
              x,
              y,
              w,
              h,
              iconW,
              iconH,
              pivot,
              follow,
              expandOffsetX,
              expandOffsetY,
            }));
            setTransform(`matrix(1,0,0,1,${x},${y})`);
          }
          setExpand(!expand);
        }}
        opacity={isInvisible ? 0 : 1}
        visibility={isInvisible ? "hidden" : "visible"}
        transition={VISIBILITY_TRANSITION}
        {...commonProps}
        {...props}>
        <Image src={src} draggable={false} />
      </Box>
      <Flex
        id={expandId}
        w={`${w}px`}
        h={`${h}px`}
        overflow="auto"
        direction="column"
        transform={transform}
        opacity={expand ? 1 : 0}
        visibility={expand ? "visible" : "hidden"}
        transition={VISIBILITY_TRANSITION}
        {...commonProps}
        bg={expandBg}
        {...props}>
        {children}
      </Flex>
    </>
  );
}

export default observer(Floating);
