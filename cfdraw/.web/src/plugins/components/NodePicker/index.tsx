import { PropsWithChildren, ReactElement, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Center,
  Flex,
  Image,
  Portal,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Box,
  ButtonProps,
  PopoverArrow,
  useDisclosure,
  ImageProps,
  ChakraProps,
} from "@chakra-ui/react";

import { BoardStore, langStore, translate, useIsReady, useSelecting } from "@carefree0910/business";

import "./index.scss";
import { ReactComponent as DeleteIcon } from "@/assets/icons/delete.svg";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";

import { INode, checkEqual, sortBy } from "@carefree0910/core";

import { UI_Words } from "@/lang/ui";
import { genBlock } from "@/utils/bem";
import { EXPAND_TRANSITION } from "@/utils/constants";
import { themeStore, useActiveBorderProps, useScrollBarSx } from "@/stores/theme";
import CFIcon from "@/components/CFIcon";
import CFText, { CFCaption } from "@/components/CFText";
import CFTooltip from "@/components/CFTooltip";
import { Event } from "@/utils/event";

// helpers

export const GalleryContainer = (props: ButtonProps) => (
  <Box as="button" w="100px" h="120px" {...props} />
);
export const SpecialGalleryContainer = (props: ButtonProps) => (
  <GalleryContainer borderWidth="3px" borderStyle="dashed" borderRadius="16px" {...props} />
);
export const GalleryClear = observer(({ onClear }: { onClear: () => void }) => {
  const lang = langStore.tgt;
  const { alertCaptionColor } = themeStore.styles;

  return (
    <SpecialGalleryContainer borderColor={alertCaptionColor} onClick={onClear}>
      <Flex
        w="100%"
        h="100%"
        gap="4px"
        align="center"
        justifyContent="center"
        color={alertCaptionColor}
        direction="column">
        <CFIcon squared={false} svg={DeleteIcon} strokeByCurrentColor />
        <CFText color={alertCaptionColor}>
          {translate(UI_Words["node-picker-clear-caption"], lang)}
        </CFText>
      </Flex>
    </SpecialGalleryContainer>
  );
});
export interface IGalleryItem<T extends INode> extends PropsWithChildren {
  node: T;
  active: boolean;
  onItemClick: (node: T) => void;
}
export const GalleryItem = observer(
  <T extends INode>({ node, active, onItemClick, children }: IGalleryItem<T>) => {
    const {
      selectColors: { activeBorderColor },
    } = themeStore.styles;

    return (
      <GalleryContainer
        p="2px"
        borderWidth="1px"
        _hover={{ borderColor: activeBorderColor }}
        onClick={() => onItemClick(node)}
        {...(active ? useActiveBorderProps(activeBorderColor) : {})}>
        {children}
      </GalleryContainer>
    );
  },
);
export const nodePickerEvent = new Event<{ type: "close" }>();

// main

const block = genBlock("c-node-picker");
interface INodePicker<T extends INode> extends ButtonProps {
  src: string;
  targetType: T["type"];
  tooltipWord: string;
  gallerItemBuilder: (node: T, i: number) => ReactElement;
  onClear?: () => void;
  specialGalleryItem?: ReactElement;
  imageProps?: Omit<ImageProps, "src">;
  iconProps?: ChakraProps;
}
function NodePicker<T extends INode>({
  src,
  targetType,
  tooltipWord,
  gallerItemBuilder,
  onClear,
  specialGalleryItem,
  imageProps,
  iconProps,
  ...props
}: INodePicker<T>) {
  const numFetchEvery = 5;
  const fetchNodes = () => {
    if (!useIsReady()) return;
    // fetch current nodes
    const { type, nodes: selectingNodes } = useSelecting("raw");
    const selectingAliases = new Set(selectingNodes.map((n) => n.alias));
    const allRenderNodes = BoardStore.graph.allRenderNodes.filter(
      (node) => !selectingAliases.has(node.alias),
    );
    const currentNodes = (type === "none" ? [] : selectingNodes)
      .concat(allRenderNodes)
      .filter((node) => node.type === targetType) as T[];
    const sorted = sortBy(
      currentNodes,
      currentNodes.map((n) => n.zIndex),
    );
    // set new nodes
    setNodes((prevNodes) => {
      if (
        checkEqual(
          prevNodes.map((n) => n.alias),
          sorted.map((n) => n.alias),
        )
      ) {
        setHasMore(false);
        return prevNodes;
      }
      setHasMore(true);
      const newNumItems = Math.min(prevNodes.length + numFetchEvery, sorted.length);
      return sorted.slice(0, newNumItems);
    });
  };

  const lang = langStore.tgt;
  const { panelBg } = themeStore.styles;
  const [nodes, setNodes] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loader, setLoader] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const { dispose } = nodePickerEvent.on(({ type }) => {
      switch (type) {
        case "close":
          onClose();
          break;
      }
    });

    return dispose;
  }, []);
  const handleObserver = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore) {
      fetchNodes();
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    });
    if (loader) {
      observer.observe(loader);
    }
    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };
  }, [loader]);
  const { isOpen, onToggle, onClose } = useDisclosure({ onOpen: fetchNodes });

  return (
    <Popover isOpen={isOpen} onClose={onClose}>
      <PopoverTrigger>
        <Center
          as="button"
          h="100%"
          position="relative"
          onClick={onToggle}
          _focus={{ outline: "none" }}
          {...props}>
          <CFTooltip label={translate(tooltipWord, lang)}>
            <Flex align="center">
              <Image src={src} {...imageProps} />
              <CFIcon
                svg={ArrowDownIcon}
                squared={false}
                className={block({ e: "icon", m: isOpen ? "expanded" : "folded" })}
                fillbyCurrentColor
                transition={EXPAND_TRANSITION}
                {...iconProps}
              />
            </Flex>
          </CFTooltip>
        </Center>
      </PopoverTrigger>
      <PopoverContent w="366px" h={isOpen ? "100%" : "0px"} maxH="320px" bg={`${panelBg}cc`}>
        <PopoverArrow />
        <Flex
          w="100%"
          h="100%"
          p="16px"
          wrap="wrap"
          gap="12px"
          align="center"
          alignContent="flex-start"
          overflow="hidden"
          sx={useScrollBarSx()}>
          {specialGalleryItem}
          {!!onClear && <GalleryClear onClear={onClear} />}
          {nodes.map(gallerItemBuilder)}
          <div ref={setLoader} />
          {!hasMore && (
            <CFCaption>{translate(UI_Words["node-picker-no-more-caption"], lang)}</CFCaption>
          )}
        </Flex>
      </PopoverContent>
    </Popover>
  );
}

export default observer(NodePicker);
