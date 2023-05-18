import React from "react";
import { observer } from "mobx-react-lite";
import {
  Box,
  ButtonProps,
  FormControl,
  FormControlProps,
  FormLabelProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Spacer,
} from "@chakra-ui/react";
import { ChromePicker, ChromePickerProps } from "react-color";

import CFTooltip, { CFFormLabel } from "./CFTooltip";

interface IColorPicker {
  pickerProps?: ChromePickerProps;
  thumbnailProps?: ButtonProps;
}
const ColorPicker: React.FC<IColorPicker> = ({ pickerProps, thumbnailProps }) => {
  const color = pickerProps?.color;

  if (!color) return null;

  return (
    <Popover>
      <PopoverTrigger>
        <Box
          as="button"
          w="32px"
          h="32px"
          position="relative"
          borderWidth="4px"
          borderColor="transparent"
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
      <Portal>
        <PopoverContent w="100%" h="100%">
          <ChromePicker disableAlpha {...pickerProps} />
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

interface ICFColorPicker extends ChromePickerProps {
  label?: string;
  tooltip?: string;
  formProps?: {
    label?: FormLabelProps;
    control?: FormControlProps;
  };
  thumbnailProps?: ButtonProps;
}
function CFColorPicker({ label, tooltip, formProps, thumbnailProps, ...props }: ICFColorPicker) {
  if (!label) {
    return (
      <CFTooltip label={tooltip}>
        <Box>
          <ColorPicker pickerProps={props} thumbnailProps={thumbnailProps} />
        </Box>
      </CFTooltip>
    );
  }
  return (
    <FormControl display="flex" alignItems="center" {...formProps?.control}>
      <CFFormLabel label={label} tooltip={{ label: tooltip }} {...formProps?.label} />
      <Spacer />
      <ColorPicker pickerProps={props} thumbnailProps={thumbnailProps} />
    </FormControl>
  );
}

export default observer(CFColorPicker);
