import { observer } from "mobx-react-lite";
import { useMemo, forwardRef, useCallback } from "react";
import {
  Box,
  ButtonProps,
  CircularProgressProps,
  Flex,
  FlexProps,
  Portal,
  TextProps,
} from "@chakra-ui/react";

import { isUndefined } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";
import { CFText, CFIconButton } from "@carefree0910/components";

import type { IFloating } from "@/schema/plugins";
import {
  BG_TRANSITION,
  DEFAULT_PLUGIN_SETTINGS,
  useVisibilityTransitionProps,
} from "@/utils/constants";
import { UI_Words } from "@/lang/ui";
import { themeStore, useScrollBarSx } from "@/stores/theme";
import {
  usePluginMessage,
  usePluginIsExpanded,
  setPluginExpanded,
  usePluginGroupIsExpanded,
  usePluginChildren,
} from "@/stores/pluginsInfo";
import { isInteractingWithBoard } from "@/hooks/useDocumentEvents";
import { parseIStr } from "@/actions/i18n";
import { CFPendingProgress, CFWorkingProgress } from "@/components/CFCircularProgress";

export function getExpandId(id: string): string {
  return `${id}_expand`;
}

const Floating = forwardRef(function (
  {
    id,
    groupId,
    w: _w, // will not take effect
    h: _h, // will not take effect
    minW: _minW, // will not take effect
    minH: _minH, // will not take effect
    maxW: _maxW, // will not take effect
    maxH: _maxH, // will not take effect
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
      expandOpacity,
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
  const taskMessage = usePluginMessage(id);
  const interactingWithBoard = isInteractingWithBoard();
  const expand = usePluginIsExpanded(id);
  const groupExpand = usePluginGroupIsExpanded(groupId);
  const iconActivated = useMemo(
    () => !isInvisible && (isUndefined(groupId) || groupExpand),
    [groupId, groupExpand, isInvisible],
  );
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
  const getCommonProps = useCallback(
    <T extends boolean>(isExpand: T): T extends true ? FlexProps : ButtonProps => ({
      p: isExpand ? "12px" : "8px",
      bg: `${isBusy ? busyColor : panelBg}${bgOpacityHex}`,
      position: "absolute",
      borderRadius: "4px",
      /**
       * if
       *   1. `interactingWithBoard` is `true`
       *   2. we are focusing on the expanded panel (isExpand=true) but the floating is not expanded
       *   3. we are focusing on the plugin icon (isExpand=false), but the icon is not activated
       * then this floating should not be interactive
       */
      pointerEvents:
        interactingWithBoard || (isExpand && !expand) || (!isExpand && !iconActivated)
          ? "none"
          : "auto",
    }),
    [panelBg, busyColor, bgOpacityHex, expand, isBusy, iconActivated, interactingWithBoard],
  );
  //// progress bar props
  const progressProps = useMemo<CircularProgressProps>(() => {
    const size = Math.floor(Math.min(iconW, iconH) * 0.8);
    return {
      size: `${size}px`,
      px: `${0.5 * (iconW - size)}px`,
      py: `${0.5 * (iconH - size)}px`,
    };
  }, [iconW, iconH]);
  //// status caption props
  const statusCaptionProps = useMemo<TextProps>(() => {
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
  expandOpacity ??= DEFAULT_PLUGIN_SETTINGS.expandOpacity;
  const expandOpacityHex = Math.round(expandOpacity * 255).toString(16);
  const expandBg = `${panelBg}${expandOpacityHex}`;
  // set expand render condition
  const renderExpand = expand || usePluginChildren(id).length > 0;

  return (
    <>
      <CFIconButton
        src={parseIStr(src)}
        tooltip={iconActivated ? parseIStr(tooltip ?? "") : ""}
        id={id}
        w={`${iconW}px`}
        h={`${iconH}px`}
        onClick={() => {
          if (!noExpand) {
            setPluginExpanded(id, !expand);
          }
          onFloatingButtonClick?.();
        }}
        {...useVisibilityTransitionProps({
          visible: !isInvisible,
          extraTransitions: BG_TRANSITION,
        })}
        _focus={{ outline: "none" }}
        {...getCommonProps(false)}
        {...props}
        imageProps={{ opacity: iconOpacity }}>
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
        {taskMessage && isBusy && isUndefined(groupId) && (
          <CFText {...statusCaptionProps}>
            {translate(
              taskMessage.status === "pending"
                ? UI_Words["task-pending-caption"]
                : UI_Words["task-working-caption"],
              lang,
            )}
          </CFText>
        )}
      </CFIconButton>
      {!noExpand && (
        <Portal containerRef={ref as any}>
          <Flex
            id={expandId}
            w={`${w}px`}
            h={`${h}px`}
            overflowX="hidden"
            direction="column"
            {...useVisibilityTransitionProps({ visible: expand })}
            {...getCommonProps(true)}
            bg={expandBg}
            sx={useScrollBarSx()}
            {...parsedExpandProps}>
            {renderExpand && children}
          </Flex>
        </Portal>
      )}
    </>
  );
});

export default observer(Floating);
