import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

import { IResponse, useIsReady, useSelecting } from "@noli/business";

import { Event } from "@/utils/event";

export interface IFloating extends FlexProps {
  id: string;
  w: number;
  h: number;
  renderFilter?: (info?: IResponse) => boolean;
}
export interface IFloatingEvent {
  id: string;
  needRender: boolean;
}
export const floatingEvent = new Event<IFloatingEvent>();

function Floating({ w, h, renderFilter, children, ...props }: IFloating) {
  const needRender = useIsReady() && (!renderFilter || renderFilter(useSelecting("raw")));
  useEffect(() => floatingEvent.emit({ id: props.id, needRender }), [needRender]);

  if (!needRender) return null;

  return (
    <Flex
      w={`${w}px`}
      h={`${h}px`}
      p="12px"
      position="absolute"
      overflow="auto"
      direction="column"
      boxShadow="2px 2px 4px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      {...props}>
      {children}
    </Flex>
  );
}

export default observer(Floating);
