import { observer } from "mobx-react-lite";
import { ReactElement } from "react";
import {
  BoxProps,
  Center,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  MenuItemProps,
  MenuList,
  MenuListProps,
  Spacer,
} from "@chakra-ui/react";

import "./index.scss";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";
import { genBlock } from "@/utils/bem";
import { themeStore } from "@/stores/theme";
import Icon from "@/components/CFIcon";

export interface ISelect<T extends string> extends MenuButtonProps {
  icon?: ReactElement;
  value: string;
  options: T[];
  iconProps?: BoxProps;
  itemSize?: string;
  optionConverter?: (option: T) => string;
  onOptionClick: (option: T) => void;
  menuListProps?: MenuListProps;
}

const block = genBlock("c-select");

function CFSelect<T extends string>({
  icon,
  value,
  options,
  iconProps,
  itemSize,
  optionConverter,
  onOptionClick,
  menuListProps,
  ...props
}: ISelect<T>) {
  props.w ??= "100%";
  props.h ??= "32px";
  props.pl ??= "12px";
  props.fontSize ??= "14px";
  itemSize ??= "14px";
  iconProps ??= {};
  iconProps.pr ??= "8px";

  const { textColor, selectColors } = themeStore.styles;
  const checkedProps = (checked: boolean): MenuItemProps => {
    if (checked) {
      return {
        color: selectColors.checkedColor,
        fontWeight: 600,
      };
    }
    return {};
  };

  return (
    <Menu>
      <MenuButton
        cursor="pointer"
        variant="unstyled"
        textAlign="left"
        userSelect="none"
        border="1px"
        borderRadius="0px"
        borderColor="transparent"
        color={textColor}
        fontSize="12px"
        _hover={{
          borderColor: selectColors.hoverBorderColor,
        }}
        _active={{
          borderColor: selectColors.activeBorderColor,
        }}
        _focus={{
          borderColor: selectColors.activeBorderColor,
        }}
        {...props}>
        <Flex>
          {value ? value : null}
          {value ? <Spacer /> : null}
          <Center color={selectColors.color} fontSize="8px" {...iconProps}>
            {icon ?? <Icon svg={ArrowDownIcon} className={block()} fillbyCurrentColor />}
          </Center>
        </Flex>
      </MenuButton>
      {options.length ? (
        <MenuList
          color={selectColors.color}
          bgColor={selectColors.bgColor}
          borderColor={selectColors.bgColor}
          fontSize={itemSize ?? "12px"}
          zIndex={10}
          {...menuListProps}>
          {options.map((option) => {
            return (
              <MenuItem
                key={option}
                bgColor={selectColors.bgColor}
                _hover={{
                  bgColor: selectColors.hoverBgColor,
                }}
                {...checkedProps(value === (optionConverter ? optionConverter(option) : option))}
                onClick={() => onOptionClick(option)}>
                {optionConverter ? optionConverter(option) : option}
              </MenuItem>
            );
          })}
        </MenuList>
      ) : null}
    </Menu>
  );
}

export default observer(CFSelect);
