import { observer } from "mobx-react-lite";
import { Box, BoxProps } from "@chakra-ui/react";
import { GroupBase, OptionBase, Select } from "chakra-react-select";

import { themeStore, useScrollBarSx } from "@/stores/theme";

interface SelectItem<T> extends OptionBase {
  value: T;
  label: string;
}
export type ICFSelect<T, isMulti extends boolean> = Parameters<
  typeof Select<SelectItem<T>, isMulti, GroupBase<SelectItem<T>>>
>[0] & { height?: string; fontSize?: string; boxProps?: BoxProps };

function CFSelect<T, isMulti extends boolean>({
  height,
  fontSize,
  boxProps,
  chakraStyles,
  ...others
}: ICFSelect<T, isMulti>) {
  height ??= "32px";
  fontSize ??= "14px";
  const {
    textColor,
    selectColors: { activeBorderColor },
  } = themeStore.styles;

  return (
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
}
export const CFSrollableSelect = observer(
  <T, isMulti extends boolean>({ chakraStyles, ...others }: ICFSelect<T, isMulti>) => {
    return (
      <CFSelect
        chakraStyles={{
          menuList: (provided) => ({
            ...provided,
            p: "0px",
            maxH: "116px",
            ...useScrollBarSx(),
          }),
          ...chakraStyles,
        }}
        {...others}
      />
    );
  },
);

export default observer(CFSelect);
