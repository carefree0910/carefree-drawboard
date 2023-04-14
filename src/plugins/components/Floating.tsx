import { observer } from "mobx-react-lite";
import { useState, useMemo, useLayoutEffect, forwardRef } from "react";
import { Box, BoxProps, Flex, FlexProps, Image, Portal } from "@chakra-ui/react";

import { Coordinate, Dictionary, isUndefined } from "@noli/core";
import {
  useBoardContainerLeftTop,
  useBoardContainerWH,
  useIsReady,
  useSelecting,
} from "@noli/business";

import type { IFloating, IPositionInfo } from "@/schema/plugins";
import { Event } from "@/utils/event";
import { DEFAULT_PLUGIN_SETTINGS, VISIBILITY_TRANSITION } from "@/utils/constants";
import { themeStore } from "@/stores/theme";

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

export interface IFloatingEvent {
  type: string;
  data: Dictionary<any>;
}
export interface IFloatingRenderEvent {
  id: string;
  expand: boolean;
  needRender: boolean;
  noExpand?: boolean;
}
export interface IFloatingControlEvent {
  id: string;
  expand?: boolean;
}
export const floatingEvent = new Event<IFloatingEvent>();
export const floatingRenderEvent = new Event<IFloatingRenderEvent>();
export const floatingControlEvent = new Event<IFloatingControlEvent>();

const Floating = forwardRef(function (
  {
    id,
    w: _w, // will not take effect
    h: _h, // will not take effect
    renderInfo: {
      w,
      h,
      iconW,
      iconH,
      pivot,
      follow,
      expandOffsetX,
      expandOffsetY,
      src,
      bgOpacity,
      renderFilter,
      useModal,
      modalOpacity,
      expandProps,
      isInvisible,
    },
    noExpand,
    onFloatingButtonClick,
    children,
    ...props
  }: IFloating,
  ref,
) {
  const needRender = useIsReady() && (!renderFilter || renderFilter(useSelecting("raw")));
  const { panelBg } = themeStore.styles;
  bgOpacity ??= DEFAULT_PLUGIN_SETTINGS.bgOpacity;
  const bgOpacityHex = Math.round(bgOpacity * 255).toString(16);
  const commonProps: BoxProps = {
    p: "12px",
    bg: `${panelBg}${bgOpacityHex}`,
    position: "absolute",
    boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)",
    borderRadius: "4px",
  };
  Object.keys(props).forEach((key) => {
    const commonV = commonProps[key as keyof BoxProps];
    (props as any)[key] ??= commonV;
  });
  const parsedExpandProps: FlexProps = {};
  Object.entries(expandProps ?? {}).forEach(([key, value]) => {
    if (!isUndefined(value) && value !== null) {
      parsedExpandProps[key as keyof FlexProps] = value;
    }
  });
  const [expand, setExpand] = useState(false);
  const [transform, setTransform] = useState<string | undefined>(undefined);
  const expandId = useMemo(() => getExpandId(id), [id]);
  // convert float to hex
  modalOpacity ??= DEFAULT_PLUGIN_SETTINGS.modalOpacity;
  const modalOpacityHex = Math.round(modalOpacity * 255).toString(16);
  const expandBg = useMemo(
    () => (useModal ? `${panelBg}${modalOpacityHex}` : commonProps.bg),
    [useModal],
  );
  useLayoutEffect(() => {
    const { dispose: disposeRender } = floatingRenderEvent.on(
      ({ id: incomingId, expand: incomingExpand }) => {
        if (id !== incomingId && incomingExpand && expand) {
          setExpand(false);
        }
      },
    );
    const { dispose: disposeControl } = floatingControlEvent.on(
      ({ id: incomingId, expand: incomingExpand }) => {
        if (id === incomingId && !isUndefined(incomingExpand)) {
          setExpand(incomingExpand);
        }
      },
    );
    floatingRenderEvent.emit({ id, expand, needRender, noExpand });

    return () => {
      disposeRender();
      disposeControl();
    };
  }, [id, expand, needRender, noExpand]);

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
          if (!noExpand) {
            setExpand(!expand);
          }
          onFloatingButtonClick?.();
        }}
        opacity={isInvisible ? 0 : 1}
        visibility={isInvisible ? "hidden" : "visible"}
        transition={VISIBILITY_TRANSITION}
        {...commonProps}
        {...props}>
        <Image src={src} draggable={false} />
      </Box>
      {!noExpand && (
        <Portal containerRef={ref as any}>
          <Flex
            id={expandId}
            w={`${w}px`}
            h={`${h}px`}
            overflowY="auto"
            overflowX="hidden"
            direction="column"
            transform={transform}
            opacity={expand ? 1 : 0}
            visibility={expand ? "visible" : "hidden"}
            transition={VISIBILITY_TRANSITION}
            {...commonProps}
            bg={expandBg}
            {...parsedExpandProps}>
            {children}
          </Flex>
        </Portal>
      )}
    </>
  );
});

export default observer(Floating);
