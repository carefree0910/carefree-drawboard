import { observer } from "mobx-react-lite";
import { useState, useMemo, useLayoutEffect, forwardRef, useCallback } from "react";
import {
  Box,
  BoxProps,
  CircularProgressProps,
  Flex,
  FlexProps,
  Image,
  Portal,
  TextProps,
} from "@chakra-ui/react";

import { Coordinate, Dictionary, isUndefined } from "@carefree0910/core";
import {
  langStore,
  translate,
  useBoardContainerLeftTop,
  useBoardContainerWH,
  useIsReady,
  useSelecting,
} from "@carefree0910/business";

import type { IFloating, IExpandPositionInfo } from "@/schema/plugins";
import { Event } from "@/utils/event";
import { BG_TRANSITION, DEFAULT_PLUGIN_SETTINGS, VISIBILITY_TRANSITION } from "@/utils/constants";
import { UI_Words } from "@/lang/ui";
import { themeStore } from "@/stores/theme";
import { getPluginMessage } from "@/stores/plugins";
import { isInteractingWithBoard } from "@/stores/pointerEvents";
import CFText from "@/components/CFText";
import CFTooltip from "@/components/CFTooltip";
import { CFPendingProgress, CFWorkingProgress } from "@/components/CFCircularProgress";

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
  }: { x: number; y: number } & IExpandPositionInfo,
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
  id?: string;
  expand?: boolean;
  ignoreId?: boolean;
  forceCheckIds?: string[];
}
export interface IFloatingIconLoadedEvent {
  id: string;
}
export const floatingEvent = new Event<IFloatingEvent>();
export const floatingRenderEvent = new Event<IFloatingRenderEvent>();
export const floatingControlEvent = new Event<IFloatingControlEvent>();
export const floatingIconLoadedEvent = new Event<IFloatingIconLoadedEvent>();

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
      tooltip,
      offsetY,
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
  const lang = langStore.tgt;
  const taskMessage = getPluginMessage(id);
  const needRender = useIsReady() && (!renderFilter || renderFilter(useSelecting("raw")));
  const interactingWithBoard = isInteractingWithBoard();
  const [expand, setExpand] = useState(false);
  const [transform, setTransform] = useState<string | undefined>();
  const isBusy = useMemo(
    () => ["pending", "working"].includes(taskMessage?.status ?? ""),
    [taskMessage?.status],
  );
  const expandId = useMemo(() => getExpandId(id), [id]);
  // styles
  const iconOpacity = useMemo(() => (isBusy ? 0.5 : 1), [isBusy]);
  const {
    panelBg,
    floatingColors: { busyColor },
  } = themeStore.styles;
  bgOpacity ??= DEFAULT_PLUGIN_SETTINGS.bgOpacity;
  const bgOpacityHex = Math.round(bgOpacity * 255).toString(16);
  const commonProps = useMemo<BoxProps>(
    () => ({
      p: "8px",
      bg: `${isBusy ? busyColor : panelBg}${bgOpacityHex}`,
      position: "absolute",
      // boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)",
      borderRadius: "4px",
      pointerEvents: interactingWithBoard ? "none" : "auto",
    }),
    [panelBg, busyColor, bgOpacityHex, isBusy, interactingWithBoard],
  );
  const progressProps = useMemo<CircularProgressProps>(() => {
    const size = Math.floor(Math.min(iconW, iconH) * 0.8);
    return {
      size: `${size}px`,
      px: `${0.5 * (iconW - size)}px`,
      py: `${0.5 * (iconH - size)}px`,
    };
  }, [iconW, iconH]);
  const progressCaptionProps = useMemo<TextProps>(() => {
    const p = 8;
    const w = 100;
    const defaultTop = "-32px";
    let top, left;
    if (!follow) {
      if (["lt", "top", "rt", "center"].includes(pivot)) {
        top = `${iconH + p}px`;
      } else if (["left", "right"].includes(pivot)) {
        top = "0px";
      } else {
        top = defaultTop;
      }
      if (["lt", "left", "lb"].includes(pivot)) {
        left = `${iconW}px`;
      } else if (["top", "center", "bottom"].includes(pivot)) {
        left = `${0.5 * (iconW - w)}px`;
      } else {
        left = `${-w}px`;
      }
    } else {
      if (
        ["left", "right"].includes(pivot) ||
        (offsetY && ["lt", "rt", "lb", "rb"].includes(pivot))
      ) {
        top = "0px";
        if (!offsetY && !["left", "right"].includes(pivot)) {
          left = `${0.5 * (iconW - w)}px`;
        } else {
          if (["lt", "left", "lb"].includes(pivot)) {
            left = `${-w}px`;
          } else {
            left = `${iconW}px`;
          }
        }
      } else {
        if (["lt", "top", "rt"].includes(pivot)) {
          top = defaultTop;
        } else {
          top = `${iconH + p}px`;
        }
        left = `${0.5 * (iconW - w)}px`;
      }
    }
    return { w: `${w}px`, top, left, position: "absolute" };
  }, [iconW, pivot]);
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
  // convert float to hex
  modalOpacity ??= DEFAULT_PLUGIN_SETTINGS.modalOpacity;
  const modalOpacityHex = Math.round(modalOpacity * 255).toString(16);
  const expandBg = useMemo(
    () => `${panelBg}${useModal ? modalOpacityHex : bgOpacityHex}`,
    [useModal],
  );
  // events
  const emitIconLoaded = useCallback(() => {
    floatingIconLoadedEvent.emit({ id });
  }, [id]);
  useLayoutEffect(() => {
    const { dispose: disposeRender } = floatingRenderEvent.on(
      ({ id: incomingId, expand: incomingExpand }) => {
        if (id !== incomingId && incomingExpand && expand) {
          setExpand(false);
        }
      },
    );
    const { dispose: disposeControl } = floatingControlEvent.on(
      ({ id: incomingId, expand: incomingExpand, ignoreId, forceCheckIds }) => {
        if (
          !isUndefined(incomingExpand) &&
          (id === incomingId ||
            (ignoreId &&
              (!forceCheckIds ||
                forceCheckIds.every((forcedId) => id !== forcedId && !id.startsWith(forcedId)))))
        ) {
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
      <CFTooltip label={tooltip} hasArrow>
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
          transition={`${VISIBILITY_TRANSITION}, ${BG_TRANSITION}`}
          {...commonProps}
          {...props}>
          <Image
            src={src}
            w="100%"
            h="100%"
            draggable={false}
            opacity={iconOpacity}
            transition={VISIBILITY_TRANSITION}
            onLoad={emitIconLoaded}
          />
          {taskMessage && isBusy && (
            <Box w={`${iconW}px`} h={`${iconH}px`} position="absolute" left="0px" top="0px">
              {taskMessage.status === "pending" ? (
                <CFPendingProgress
                  {...progressProps}
                  value={(1.0 - taskMessage.pending / Math.max(taskMessage.total, 1)) * 100}
                />
              ) : (
                <CFWorkingProgress
                  {...progressProps}
                  value={(taskMessage.data.progress ?? 0.0) * 100}
                />
              )}
            </Box>
          )}
          {taskMessage && isBusy && (
            <CFText {...progressCaptionProps}>
              {translate(
                taskMessage.status === "pending"
                  ? UI_Words["task-pending-caption"]
                  : UI_Words["task-working-caption"],
                lang,
              )}
            </CFText>
          )}
        </Box>
      </CFTooltip>
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
