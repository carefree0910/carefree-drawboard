import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex, Image, ImageProps } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";

import ImageIcon from "@/assets/icons/image.svg";
import { ReactComponent as ImportIcon } from "@/assets/icons/import.svg";

import { IImageNode } from "@carefree0910/core";

import type { IField } from "@/schema/plugins";
import type { IImageField } from "@/schema/fields";
import { UI_Words } from "@/lang/ui";
import { Toast_Words } from "@/lang/toast";
import { toastWord } from "@/utils/toast";
import { titleCaseWord } from "@/utils/misc";
import { IMAGE_PLACEHOLDER } from "@/utils/constants";
import { themeStore } from "@/stores/theme";
import {
  IMetaInjection,
  getMetaField,
  makeMetaInjectionFrom,
  setMetaField,
  setMetaInjection,
} from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFIcon from "@/components/CFIcon";
import CFText, { CFCaption } from "@/components/CFText";
import CFTooltip, { CFFormLabel } from "@/components/CFTooltip";
import CFImageUploader from "@/components/CFImageUploader";
import { useDefaultFieldValue } from "./utils";
import NodePicker, {
  GalleryItem,
  IGalleryItem,
  SpecialGalleryContainer,
  nodePickerEvent,
} from "../NodePicker";

interface IOnSelectUrl {
  onSelectUrl: (url: string, injection: IMetaInjection | undefined) => void;
}
const ImageGalleryUpload = observer(({ onSelectUrl }: IOnSelectUrl) => {
  const lang = langStore.tgt;
  const { captionColor, dividerColor } = themeStore.styles;

  return (
    <CFImageUploader
      addToBoard={false}
      onUpload={(res) => {
        if (res.safe) {
          toastWord("success", Toast_Words["upload-image-success-message"]);
          onSelectUrl(res.url, { node: { meta: { type: "upload", data: {} } } });
        } else {
          toastWord("warning", Toast_Words["nsfw-image-detected-warning-message"], {
            appendix: ` (${res.reason})`,
          });
        }
      }}>
      <SpecialGalleryContainer borderColor={dividerColor}>
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
      </SpecialGalleryContainer>
    </CFImageUploader>
  );
});
interface IImageGalleryItem
  extends Omit<IGalleryItem<IImageNode>, "onItemClick">,
    Omit<ImageProps, "src">,
    IOnSelectUrl {}
const ImageGalleryItem = observer(({ node, active, onSelectUrl, ...others }: IImageGalleryItem) => (
  <GalleryItem
    node={node}
    active={active}
    onItemClick={(node) =>
      makeMetaInjectionFrom(node).then((injection) => onSelectUrl(node.renderParams.src, injection))
    }>
    <Image
      w="100%"
      h="100%"
      objectFit="contain"
      src={node.renderParams.src}
      fallbackSrc={IMAGE_PLACEHOLDER}
      {...others}
    />
  </GalleryItem>
));

function ImageField({
  definition,
  onFieldChange,
  onFieldChangeComplete,
  ...fieldKeys
}: IField<IImageField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const lang = langStore.tgt;
  const { panelBg } = themeStore.styles;
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? definition.default);
  const setValueAndMeta = (value: string, injection: IMetaInjection | undefined) => {
    setValue(value);
    setMetaField(fieldKeys, value);
    setMetaInjection(fieldKeys, injection);
    onFieldChange?.(value);
    onFieldChangeComplete?.(value);
  };
  const onSelectUrl = (url: string, injection: IMetaInjection | undefined) => {
    setValueAndMeta(url, injection);
    nodePickerEvent.emit({ type: "close" });
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
          <CFCaption flex={1} noOfLines={1}>
            {translate(UI_Words["image-field-url-placeholder"], lang)}
          </CFCaption>
        )}
      </CFTooltip>
      <NodePicker<IImageNode>
        src={ImageIcon}
        targetType="image"
        tooltipWord={UI_Words["image-field-image-picker"]}
        gallerItemBuilder={(node, i) => {
          const active = node.renderParams.src === value;
          return (
            <ImageGalleryItem
              key={i}
              node={node}
              active={active}
              onSelectUrl={onSelectUrl}
              borderWidth={active ? "2px" : "1px"}
            />
          );
        }}
        onClear={!!value ? () => onSelectUrl("", undefined) : undefined}
        specialGalleryItem={<ImageGalleryUpload onSelectUrl={onSelectUrl} />}
        usePortal={!definition.inList}
      />
    </Flex>
  );
}

export default observer(ImageField);
