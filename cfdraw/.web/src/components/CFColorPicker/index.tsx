import type { ColorPickerBaseProps } from "react-colorful/dist/types";
import React from "react";
import { observer } from "mobx-react-lite";
import {
  Box,
  ButtonProps,
  Flex,
  FormControl,
  FormControlProps,
  FormLabelProps,
  Popover,
  PopoverArrow,
  PopoverTrigger,
  Spacer,
  useDisclosure,
} from "@chakra-ui/react";
import { HexAlphaColorPicker as Picker, HexColorInput } from "react-colorful";

import "./index.scss";
import { genBlock } from "@/utils/bem";
import CFTooltip, { CFFormLabel } from "../CFTooltip";
import CFPopoverContent from "../CFPopoverContent";

const block = genBlock("c-color-picker");

interface IColorPicker {
  pickerProps?: ColorPickerBaseProps<string>;
  thumbnailProps?: ButtonProps;
  onClose?: () => void;
}
const ColorPicker: React.FC<IColorPicker> = ({
  pickerProps,
  thumbnailProps,
  onClose: externalOnClose,
}) => {
  const color = pickerProps?.color;
  const { isOpen, onToggle, onClose } = useDisclosure({ onClose: externalOnClose });

  if (!color) return null;

  return (
    <Popover isOpen={isOpen} onClose={onClose}>
      <PopoverTrigger>
        <Box
          as="button"
          w="32px"
          h="32px"
          position="relative"
          borderWidth="4px"
          borderColor="transparent"
          onClick={onToggle}
          {...thumbnailProps}>
          <Box
            w="100%"
            h="100%"
            borderWidth="2px"
            borderRadius="2px"
            borderColor="transparent"
            bg={color.toString()}
          />
        </Box>
      </PopoverTrigger>
      <CFPopoverContent w="100%" h="100%" usePortal>
        <PopoverArrow />
        <Flex w="100%" h="100%" p="16px" direction="column">
          <Picker {...pickerProps} className={block()} />
          <HexColorInput
            alpha
            prefixed
            color={color}
            onChange={pickerProps.onChange}
            className={block({ e: "input" })}
          />
        </Flex>
      </CFPopoverContent>
    </Popover>
  );
};

interface ICFColorPicker extends ColorPickerBaseProps<string> {
  label?: string;
  tooltip?: string;
  formProps?: {
    label?: FormLabelProps;
    control?: FormControlProps;
  };
  thumbnailProps?: ButtonProps;
  onClose?: () => void;
}
function CFColorPicker({
  label,
  tooltip,
  formProps,
  thumbnailProps,
  onClose,
  ...props
}: ICFColorPicker) {
  const colorPickerProps: IColorPicker = {
    pickerProps: props,
    thumbnailProps,
    onClose,
  };
  if (!label) {
    return (
      <CFTooltip label={tooltip}>
        <Box>
          <ColorPicker {...colorPickerProps} />
        </Box>
      </CFTooltip>
    );
  }
  return (
    <FormControl display="flex" alignItems="center" {...formProps?.control}>
      <CFFormLabel label={label} tooltip={{ label: tooltip }} {...formProps?.label} />
      <Spacer />
      <ColorPicker {...colorPickerProps} />
    </FormControl>
  );
}

export default observer(CFColorPicker);
