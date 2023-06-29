import { Box, TextProps, TextareaProps } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useCallback, useMemo, useState } from "react";

import { ITextNode, isUndefined } from "@carefree0910/core";

import TextIcon from "@/assets/icons/add-text.svg";
import type { IField } from "@/schema/plugins";
import type { ITextField } from "@/schema/fields";
import { UI_Words } from "@/lang/ui";
import { titleCaseWord } from "@/utils/misc";
import { themeStore, useScrollBarSx } from "@/stores/theme";
import {
  IMetaInjection,
  getListInjectionKey,
  getMetaInjection,
  makeMetaInjectionFrom,
  setMetaInjection,
} from "@/stores/meta";
import { getFieldData, setFieldData } from "@/stores/dataCenter";
import { parseIStr } from "@/actions/i18n";
import CFInput from "@/components/CFInput";
import CFTextarea from "@/components/CFTextarea";
import { useDefaultFieldValue } from "./utils";
import NodePicker, { GalleryItem, IGalleryItem, nodePickerEvent } from "../NodePicker";

interface ITextGalleryItem extends Omit<IGalleryItem<ITextNode>, "onItemClick">, TextareaProps {
  onSelectText: (content: string, injection: IMetaInjection | undefined) => void;
}
const TextGalleryItem = observer(({ node, active, onSelectText, ...others }: ITextGalleryItem) => (
  <GalleryItem
    node={node}
    active={active}
    onItemClick={(node) =>
      makeMetaInjectionFrom(node).then((injection) => onSelectText(node.params.content, injection))
    }>
    <CFTextarea
      isReadOnly
      w="100%"
      h="100%"
      p="4px"
      objectFit="contain"
      value={node.params.content}
      cursor="pointer"
      sx={useScrollBarSx()}
      border="0px"
      fontSize="10px"
      resize="none"
      {...others}
    />
  </GalleryItem>
));

function TextField({
  definition,
  onFieldChange,
  onFieldChangeComplete,
  ...fieldKeys
}: IField<ITextField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? label);
  const defaultText = parseIStr(definition.default ?? "");
  const { captionColor } = themeStore.styles;
  const [value, setValue] = useState(getFieldData(fieldKeys) ?? defaultText);
  const isNumber = useMemo(() => !!definition.numberOptions, [definition.numberOptions]);
  const Input = definition.numRows && definition.numRows > 1 ? CFTextarea : CFInput;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = event.target.value;
      setValue(v);
      if (!isNumber) {
        setFieldData(fieldKeys, v);
        onFieldChange?.(v);
      }
    },
    [isNumber, fieldKeys, setValue, onFieldChange],
  );
  const onBlur = useCallback(() => {
    if (!definition.numberOptions) {
      onFieldChangeComplete?.(value);
    } else {
      let number = +value;
      const options = definition.numberOptions;
      if (isNaN(number)) number = 0;
      if (!isUndefined(options.min)) {
        number = Math.max(number, options.min);
      }
      if (!isUndefined(options.max)) {
        number = Math.min(number, options.max);
      }
      if (options.isInt) {
        number = Math.round(number);
      }
      setValue(number.toString());
      setFieldData(fieldKeys, number);
      onFieldChange?.(number);
      onFieldChangeComplete?.(number);
    }
  }, [fieldKeys, value, setValue, onFieldChange, definition.numberOptions]);
  const onSelectText = (content: string, injection: IMetaInjection | undefined) => {
    setValue(content);
    if (!isNumber) {
      setFieldData(fieldKeys, content);
    }
    setMetaInjection(fieldKeys, injection);
    nodePickerEvent.emit({ type: "close" });
  };
  const hasInjection = !!getMetaInjection(getListInjectionKey(fieldKeys));
  const hasInjectionProps = useMemo<TextProps | TextareaProps>(() => {
    const props: TextProps | TextareaProps = {
      isReadOnly: hasInjection,
    };
    if (hasInjection) {
      props.color = captionColor;
    }
    return props;
  }, [hasInjection, captionColor]);

  return (
    <Box w="100%" position="relative">
      <Input
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        tooltip={tooltip}
        placeholder={label}
        {...definition.props}
        {...hasInjectionProps}
      />
      <Box right="1px" bottom="1px" position="absolute">
        <NodePicker<ITextNode>
          p="4px"
          bg="#ffffff88"
          borderRadius="6px"
          imageProps={{ w: "20px", h: "20px", pr: "-12px" }}
          iconProps={{ w: "20px", h: "20px", p: "4px", m: "0px" }}
          src={TextIcon}
          targetType="text"
          tooltipWord={UI_Words["text-field-text-picker"]}
          gallerItemBuilder={(node, i) => {
            const active = node.params.content === value;
            return (
              <TextGalleryItem
                key={i}
                node={node}
                active={active}
                onSelectText={onSelectText}
                borderWidth={active ? "2px" : "1px"}
              />
            );
          }}
          onClear={!!value ? () => onSelectText("", undefined) : undefined}
          usePortal={!definition.inList}
        />
      </Box>
    </Box>
  );
}

export default observer(TextField);
