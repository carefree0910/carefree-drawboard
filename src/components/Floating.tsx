import { observer } from "mobx-react-lite";
import { useState, useEffect, useMemo } from "react";
import { Fade, Flex, FlexProps, Image } from "@chakra-ui/react";

import type { PivotType } from "@noli/core";
import { IResponse, useIsReady, useSelecting } from "@noli/business";

import { Event } from "@/utils/event";

export interface IFloating extends FlexProps {
  id: string;
  w: number;
  h: number;
  iconW: number;
  iconH: number;
  pivot: PivotType;
  renderFilter?: (info?: IResponse) => boolean;
}
export interface IFloatingEvent {
  id: string;
  needRender: boolean;
}
export const floatingEvent = new Event<IFloatingEvent>();

function Floating({ id, w, h, iconW, iconH, pivot, renderFilter, children, ...props }: IFloating) {
  const needRender = useIsReady() && (!renderFilter || renderFilter(useSelecting("raw")));
  const [expand, setExpand] = useState(false);
  const [transform, setTransform] = useState<string | undefined>(undefined);
  const currentW = useMemo(() => (expand ? w : iconW), [w, iconW, expand]);
  const currentH = useMemo(() => (expand ? h : iconH), [h, iconH, expand]);
  const nextW = useMemo(() => (expand ? iconW : w), [w, iconW, expand]);
  const nextH = useMemo(() => (expand ? iconH : h), [h, iconH, expand]);
  useEffect(() => floatingEvent.emit({ id, needRender }), [expand, needRender]);

  if (!needRender) return null;

  return (
    <Flex
      id={id}
      as={expand ? undefined : "button"}
      w={`${currentW}px`}
      h={`${currentH}px`}
      p="12px"
      position="absolute"
      overflow="auto"
      direction="column"
      boxShadow="2px 2px 4px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      transform={transform}
      onClick={() => {
        if (!expand) {
          const self = document.querySelector<HTMLDivElement>(`#${id}`);
          if (self && self.dataset.x && self.dataset.y) {
            let x = parseFloat(self.dataset.x);
            let y = parseFloat(self.dataset.y);
            // x
            if (["top", "center", "bottom"].includes(pivot)) {
              x += 0.5 * (currentW - nextW);
            } else if (["rt", "right", "rb"].includes(pivot)) {
              x += currentW - nextW;
            }
            // y
            if (["left", "center", "right"].includes(pivot)) {
              y += 0.5 * (currentH - nextH);
            } else if (["lb", "bottom", "rb"].includes(pivot)) {
              y += currentH - nextH;
            }
            setTransform(`matrix(1,0,0,1,${x},${y})`);
          }
          setExpand(!expand);
        }
      }}
      data-expand={expand}
      {...props}>
      {expand ? (
        children
      ) : (
        <Image
          width={iconW}
          height={iconH}
          src="https://ailab-huawei-cdn.nolibox.com/upload/images/ec388e38bdac4f72978b895c2f686cdf.png"
          draggable={false}
        />
      )}
    </Flex>
  );
}

export default observer(Floating);
