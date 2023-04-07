import { observer } from "mobx-react-lite";
import { useState, useMemo, useLayoutEffect } from "react";
import { Box, BoxProps, Flex, Image } from "@chakra-ui/react";

import { Coordinate } from "@noli/core";
import { useIsReady, useSelecting } from "@noli/business";

import type { IFloating, IPositionInfo } from "@/types/plugins";
import { Event } from "@/utils/event";
import { themeStore } from "@/stores/theme";

export interface IFloatingEvent {
  id: string;
  needRender: boolean;
}
export const floatingEvent = new Event<IFloatingEvent>();

export function getExpandId(id: string): string {
  return `${id}_expand`;
}
export function getExpandPosition({
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
}: { x: number; y: number } & IPositionInfo): Coordinate {
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
  w,
  h,
  iconW,
  iconH,
  pivot,
  follow,
  expandOffsetX,
  expandOffsetY,
  renderFilter,
  children,
  ...props
}: IFloating) {
  const needRender = useIsReady() && (!renderFilter || renderFilter(useSelecting("raw")));
  const { panelBg } = themeStore.styles;
  const [expand, setExpand] = useState(false);
  const [transform, setTransform] = useState<string | undefined>(undefined);
  const expandId = useMemo(() => getExpandId(id), [id]);
  useLayoutEffect(() => floatingEvent.emit({ id, needRender }), [expand, needRender]);

  if (!needRender) return null;

  const commonProps: BoxProps = {
    p: "12px",
    bg: `${panelBg}88`,
    position: "absolute",
    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)",
    borderRadius: "4px",
  };

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
            ({ x, y } = getExpandPosition({
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
        transition="opacity 0.3s cubic-bezier(.08,.52,.52,1), visibility 0.3s cubic-bezier(.08,.52,.52,1)"
        {...commonProps}
        {...props}>
        {children}
      </Flex>
    </>
  );
}

export default observer(Floating);
