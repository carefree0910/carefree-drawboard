import { observer } from "mobx-react-lite";
import { Box, BoxProps, Flex, FlexProps, FormLabelProps } from "@chakra-ui/react";
import { GroupBase, OptionBase, Select } from "chakra-react-select";

import { isUndefined } from "@carefree0910/core";

import { themeStore, useScrollBarSx } from "@/stores/theme";
import CFTooltip, { CFFormLabel } from "./CFTooltip";

interface SelectItem<T> extends OptionBase {
  value: T;
  label: string;
}
export type ICFSelect<T, isMulti extends boolean> = Parameters<
  typeof Select<SelectItem<T>, isMulti, GroupBase<SelectItem<T>>>
>[0] & { tooltip?: string; height?: string; fontSize?: string; boxProps?: BoxProps };

function CFSelect<T, isMulti extends boolean>({
  tooltip,
  height,
  fontSize,
  boxProps,
  chakraStyles,
  ...others
}: ICFSelect<T, isMulti>) {
  height ??= "42px";
  fontSize ??= "16px";
  const {
    textColor,
    selectColors: { activeBorderColor },
  } = themeStore.styles;

  const _Select = (
    <Box position="relative" {...boxProps}>
      <Select
        selectedOptionStyle="check"
        menuPortalTarget={document.body}
        chakraStyles={{
          dropdownIndicator: (provided) => ({
            ...provided,
            bg: "transparent",
            px: "10px",
            cursor: "inherit",
          }),
          indicatorSeparator: (provided) => ({
            ...provided,
            display: "none",
          }),
          control: (provided) => ({
            ...provided,
            color: textColor,
            minHeight: height,
            borderRadius: "0px",
            borderColor: "transparent",
            fontSize,
            _focus: {
              borderColor: activeBorderColor,
              boxShadow: `0 0 0 1px ${activeBorderColor}`,
            },
          }),
          menu: (provided) => ({
            ...provided,
            color: textColor,
          }),
          menuList: (provided) => ({
            ...provided,
            p: "0px",
          }),
          ...chakraStyles,
        }}
        {...others}
      />
    </Box>
  );
  if (isUndefined(tooltip)) return _Select;
  return <CFTooltip label={tooltip}>{_Select}</CFTooltip>;
}

interface ICFScrollableSelect<T, isMulti extends boolean> extends ICFSelect<T, isMulti> {
  label?: string;
  flexProps?: FlexProps;
  labelProps?: FormLabelProps;
}
export const CFSrollableSelect = observer(
  <T, isMulti extends boolean>({
    label,
    tooltip,
    flexProps,
    labelProps,
    chakraStyles,
    ...others
  }: ICFScrollableSelect<T, isMulti>) => {
    const menuList = (provided: any) => ({
      ...provided,
      p: "0px",
      maxH: "116px",
      ...useScrollBarSx(),
    });
    if (isUndefined(label)) {
      return (
        <CFSelect tooltip={tooltip} chakraStyles={{ menuList, ...chakraStyles }} {...others} />
      );
    }
    return (
      <Flex w="100%" h="100%" align="center" {...flexProps}>
        <CFFormLabel label={label} tooltip={{ label: tooltip }} {...labelProps} />
        <Box w="8px" />
        <CFSelect chakraStyles={{ menuList, ...chakraStyles }} {...others} />
      </Flex>
    );
  },
);

export default observer(CFSelect);
