import { observer } from "mobx-react-lite";
import { useState, useMemo, useLayoutEffect, forwardRef, useCallback, useEffect } from "react";
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

import { Dictionary, isUndefined } from "@carefree0910/core";
import { langStore, translate, useIsReady, useSelecting } from "@carefree0910/business";

import iconLoading from "@/assets/icon-loading.json";
import type { IFloating } from "@/schema/plugins";
import { Event } from "@/utils/event";
import { BG_TRANSITION, DEFAULT_PLUGIN_SETTINGS, VISIBILITY_TRANSITION } from "@/utils/constants";
import { UI_Words } from "@/lang/ui";
import { themeStore } from "@/stores/theme";
import { settingsStore } from "@/stores/settings";
import { getPluginMessage } from "@/stores/plugins";
import { isInteractingWithBoard } from "@/stores/pointerEvents";
import CFText from "@/components/CFText";
import CFLottie from "@/components/CFLottie";
import CFTooltip from "@/components/CFTooltip";
import { CFPendingProgress, CFWorkingProgress } from "@/components/CFCircularProgress";

export function getExpandId(id: string): string {
  return `${id}_expand`;
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
export interface IFloatingGroupEvent {
  id: string;
  groupId?: string;
  expand: boolean;
}
export const floatingEvent = new Event<IFloatingEvent>();
export const floatingRenderEvent = new Event<IFloatingRenderEvent>();
export const floatingControlEvent = new Event<IFloatingControlEvent>();
export const floatingIconLoadedEvent = new Event<IFloatingIconLoadedEvent>();
export const floatingGroupEvent = new Event<IFloatingGroupEvent>();

const Floating = forwardRef(function (
  {
    id,
    isGroup,
    groupId,
    w: _w, // will not take effect
    h: _h, // will not take effect
    renderInfo: {
      w,
      h,
      iconW,
      iconH,
      pivot,
      follow,
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
  const [iconLoaded, setIconLoaded] = useState(false);
  const [groupIsExpanded, setGroupIsExpanded] = useState(!groupId);
  const iconLoadingPatience =
    settingsStore.boardSettings?.globalSettings?.iconLoadingPatience ?? 100;
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
    lottieColors: { iconLoadingColor },
  } = themeStore.styles;
  bgOpacity ??= DEFAULT_PLUGIN_SETTINGS.bgOpacity;
  const bgOpacityHex = Math.round(bgOpacity * 255).toString(16);
  const getCommonProps = useCallback<(isExpand: boolean) => BoxProps>(
    (isExpand) => ({
      p: "8px",
      bg: `${isBusy ? busyColor : panelBg}${bgOpacityHex}`,
      position: "absolute",
      // boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)",
      borderRadius: "4px",
      /**
       * if this floating belongs to a group, and:
       *   1. `interactingWithBoard` is `true`
       *   2. we are focusing on the plugin button (isExpand=false) and the group is not expanded
       *   3. we are focusing on the expanded panel (isExpand=true) but the floating is not expanded
       * then this floating should not be interactive
       */
      pointerEvents:
        (!groupIsExpanded && (!isExpand || !expand)) || interactingWithBoard ? "none" : "auto",
    }),
    [panelBg, busyColor, bgOpacityHex, expand, isBusy, groupIsExpanded, interactingWithBoard],
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
  //// maintain icon loaded state
  const onIconLoaded = useCallback(() => {
    floatingIconLoadedEvent.emit({ id });
    setIconLoaded(true);
  }, [id]);
  //// handle expand events
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
  //// handle group events
  ////// emit expand event if this floating represents a group
  useEffect(() => {
    if (isGroup) {
      floatingGroupEvent.emit({ id, expand });
    }
  }, [id, isGroup, expand]);
  ////// handle expand event if this floating is in a group
  useEffect(() => {
    if (!isGroup && !!groupId) {
      const { dispose } = floatingGroupEvent.on(({ id: incomingId, expand: incomingExpand }) => {
        if (groupId === incomingId) {
          setGroupIsExpanded(incomingExpand);
        }
      });
      return dispose;
    }
  }, [id, isGroup, groupId]);

  if (!needRender) return null;

  iconLoading.layers.forEach((layer) => {
    if (!layer.shapes) return;
    if (layer.shapes[0].it[1].c?.k) {
      layer.shapes[0].it[1].c.k = iconLoadingColor;
    }
  });
  return (
    <>
      <CFTooltip label={groupIsExpanded ? tooltip : ""}>
        <Box
          as="button"
          id={id}
          w={`${iconW}px`}
          h={`${iconH}px`}
          onClick={() => {
            if (!noExpand) {
              setExpand(!expand);
            }
            onFloatingButtonClick?.();
          }}
          opacity={isInvisible ? 0 : 1}
          visibility={isInvisible ? "hidden" : "visible"}
          transition={`${VISIBILITY_TRANSITION}, ${BG_TRANSITION}`}
          {...getCommonProps(false)}
          {...props}>
          <Image
            src={src}
            w="100%"
            h="100%"
            draggable={false}
            opacity={iconOpacity}
            transition={VISIBILITY_TRANSITION}
            onLoad={onIconLoaded}
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
          <CFLottie
            w="100%"
            h="100%"
            position="absolute"
            left="0px"
            top="0px"
            hide={iconLoaded}
            delay={iconLoadingPatience}
            animationData={iconLoading}
          />
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
            opacity={expand ? 1 : 0}
            visibility={expand ? "visible" : "hidden"}
            transition={VISIBILITY_TRANSITION}
            {...getCommonProps(true)}
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
