import { useEffect, useState } from "react";
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
  ImageProps,
  ButtonProps,
  PopoverArrow,
  useDisclosure,
} from "@chakra-ui/react";

import { BoardStore, langStore, translate, useSelecting } from "@carefree0910/business";

import "./index.scss";
import ImageIcon from "@/assets/icons/image.svg";
import { ReactComponent as ImportIcon } from "@/assets/icons/import.svg";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";

import { IImageNode, checkEqual } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { IImageField } from "@/schema/fields";
import { UI_Words } from "@/lang/ui";
import { Toast_Words } from "@/lang/toast";
import { genBlock } from "@/utils/bem";
import { toastWord } from "@/utils/toast";
import { titleCaseWord } from "@/utils/misc";
import { EXPAND_TRANSITION, IMAGE_PLACEHOLDER } from "@/utils/constants";
import { themeStore, useActiveBorderProps, useScrollBarSx } from "@/stores/theme";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFIcon from "@/components/CFIcon";
import CFText, { CFCaption } from "@/components/CFText";
import CFTooltip, { CFFormLabel } from "@/components/CFTooltip";
import CFImageUploader from "@/components/CFImageUploader";
import { useDefaultFieldValue } from "../utils";

const GalleryContainer = (props: ButtonProps) => <Box as="button" w="100px" h="120px" {...props} />;
interface IOnSelectUrl {
  onSelectUrl: (url: string) => void;
}
const GalleryUpload = observer(({ onSelectUrl }: IOnSelectUrl) => {
  const lang = langStore.tgt;
  const { captionColor, dividerColor } = themeStore.styles;

  return (
    <CFImageUploader
      addToBoard={false}
      onUpload={(res) => {
        if (res.safe) {
          toastWord("success", Toast_Words["upload-image-success-message"]);
          onSelectUrl(res.url);
        } else {
          toastWord("warning", Toast_Words["nsfw-image-detected-warning-message"], {
            appendix: ` (${res.reason})`,
          });
        }
      }}>
      <GalleryContainer
        borderWidth="3px"
        borderStyle="dashed"
        borderRadius="16px"
        borderColor={dividerColor}>
        <Flex
          w="100%"
          h="100%"
          gap="4px"
          align="center"
          justifyContent="center"
          color={captionColor}
          direction="column">
          <CFIcon squared={false} svg={ImportIcon} strokeByCurrentColor />
          <CFCaption>{translate(UI_Words["image-field-import-image-caption"], lang)}</CFCaption>
        </Flex>
      </GalleryContainer>
    </CFImageUploader>
  );
});
interface IGalleryItem extends ImageProps, IOnSelectUrl {
  src: string;
  active: boolean;
}
const GalleryItem = observer(({ src, active, onSelectUrl, ...others }: IGalleryItem) => {
  const {
    selectColors: { activeBorderColor },
  } = themeStore.styles;

  return (
    <GalleryContainer
      p="2px"
      borderWidth="1px"
      _hover={{ borderColor: activeBorderColor }}
      onClick={() => onSelectUrl(src)}
      {...(active ? useActiveBorderProps(activeBorderColor) : {})}>
      <Image
        w="100%"
        h="100%"
        objectFit="contain"
        src={src}
        fallbackSrc={IMAGE_PLACEHOLDER}
        {...others}
      />
    </GalleryContainer>
  );
});

const block = genBlock("c-image-field");
function ImageField({ definition, ...fieldKeys }: IField<IImageField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const lang = langStore.tgt;
  const { panelBg } = themeStore.styles;
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? definition.default);
  const setValueAndMeta = (value: string) => {
    setValue(value);
    setMetaField(fieldKeys, value);
  };
  const [imageNodes, setImageNodes] = useState<IImageNode[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const numFetchEvery = 5;
  const fetchImages = () => {
    // fetch current image nodes
    const { type, nodes: selectingNodes } = useSelecting("raw");
    const selectingAliases = new Set(selectingNodes.map((n) => n.alias));
    const allRenderNodes = BoardStore.graph.allRenderNodes.filter(
      (node) => !selectingAliases.has(node.alias),
    );
    const currentImageNodes = (type === "none" ? [] : selectingNodes)
      .concat(allRenderNodes)
      .filter((node) => node.type === "image") as IImageNode[];
    // set new image nodes
    setImageNodes((prevImageNodes) => {
      if (
        checkEqual(
          prevImageNodes.map((n) => n.alias),
          currentImageNodes.map((n) => n.alias),
        )
      ) {
        setHasMore(false);
        return prevImageNodes;
      }
      setHasMore(true);
      const newNumItems = Math.min(prevImageNodes.length + numFetchEvery, currentImageNodes.length);
      return currentImageNodes.slice(0, newNumItems);
    });
  };
  const [loader, setLoader] = useState<HTMLElement | null>(null);
  const handleObserver = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore) {
      fetchImages();
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
  const { isOpen, onToggle, onClose } = useDisclosure({ onOpen: fetchImages });
  const onSelectUrl = (url: string) => {
    setValueAndMeta(url);
  };

  return (
    <Flex w="100%" align="center" {...definition.props}>
      <CFFormLabel label={label} tooltip={{ label: tooltip }} />
      <CFTooltip
        bg={value ? panelBg : undefined}
        hasArrow={!value}
        borderWidth="1px"
        label={
          value ? (
            <Image my="6px" src={value} fallbackSrc={IMAGE_PLACEHOLDER} />
          ) : (
            translate(UI_Words["image-field-image-picker-tooltip"], lang)
          )
        }>
        {value ? (
          <CFText flex={1} noOfLines={1}>
            {value}
          </CFText>
        ) : (
          <CFCaption flex={1}>{translate(UI_Words["image-field-url-placeholder"], lang)}</CFCaption>
        )}
      </CFTooltip>
      <Popover isOpen={isOpen} onClose={onClose}>
        <PopoverTrigger>
          <Center as="button" h="100%" position="relative" onClick={onToggle}>
            <CFTooltip label={translate(UI_Words["image-field-image-picker"], lang)}>
              <Flex>
                <Image src={ImageIcon} />
                <CFIcon
                  svg={ArrowDownIcon}
                  squared={false}
                  className={block({ e: "icon", m: isOpen ? "expanded" : "folded" })}
                  fillbyCurrentColor
                  transition={EXPAND_TRANSITION}
                />
              </Flex>
            </CFTooltip>
          </Center>
        </PopoverTrigger>
        <Portal>
          <PopoverContent w="358px" h="320px" bg={`${panelBg}cc`}>
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
              <GalleryUpload onSelectUrl={onSelectUrl} />
              {imageNodes.map((node, i) => {
                const src = node.renderParams.src;
                const active = src === value;
                return (
                  <GalleryItem
                    src={node.renderParams.src}
                    active={active}
                    onSelectUrl={onSelectUrl}
                    key={`gallery-item-${i}`}
                  />
                );
              })}
              <div ref={setLoader} />
              {!hasMore && (
                <CFCaption>{translate(UI_Words["image-field-no-more-caption"], lang)}</CFCaption>
              )}
            </Flex>
          </PopoverContent>
        </Portal>
      </Popover>
    </Flex>
  );
}

export default observer(ImageField);
