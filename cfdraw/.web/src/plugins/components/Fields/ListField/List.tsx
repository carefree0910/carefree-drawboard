import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { useState } from "react";
import {
  Box,
  Center,
  Flex,
  FlexProps,
  Image,
  ImageProps,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverTrigger,
  Spacer,
} from "@chakra-ui/react";

import {
  Dictionary,
  Logger,
  getRandomHash,
  isString,
  isUndefined,
  shallowCopy,
} from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import "./index.scss";
import AddIcon from "@/assets/icons/add.svg";
import MinusIcon from "@/assets/icons/minus.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";

import type { IField, IListProperties } from "@/schema/plugins";
import type { IDefinitions, IListField } from "@/schema/fields";
import { genBlock } from "@/utils/bem";
import { titleCaseWord } from "@/utils/misc";
import { DEFAULT_FIELD_H, DEFAULT_GAP, EXPAND_TRANSITION } from "@/utils/constants";
import { UI_Words } from "@/lang/ui";
import { useScrollBarSx } from "@/stores/theme";
import {
  getListInjectionKey,
  getMetaField,
  getMetaInjection,
  setMetaField,
  setMetaInjection,
} from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFIcon from "@/components/CFIcon";
import CFText, { CFCaption } from "@/components/CFText";
import CFTooltip from "@/components/CFTooltip";
import CFPopoverContent from "@/components/CFPopoverContent";
import { getFieldH, useDefaultFieldValue } from "../utils";
import { Field } from "../Field";

export const ID_KEY = "^_^__id__^_^";
export interface IListItem extends Dictionary<any> {
  [ID_KEY]: string;
}

const block = genBlock("c-list-field");
const iconProps: ImageProps = { w: "24px", h: "24px", cursor: "pointer" };

interface IListBody {
  field: string;
  values: IListItem[];
  expanded: boolean;
  getFlexProps: (expanded: boolean) => FlexProps;
  getDefinitions: (pack: IListItem, index: number) => IDefinitions;
  gap?: number;
  getDisplayKey?: (pack: IListItem, index: number) => string | undefined;
}
let ListBody = ({
  field,
  values,
  expanded,
  getFlexProps,
  getDefinitions,
  gap = DEFAULT_GAP,
  getDisplayKey,
}: IListBody) => {
  const lang = langStore.tgt;

  const onDelete = (index: number, definitions: IDefinitions) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    setMetaField({ field }, newValues);
    runInAction(() => {
      Object.keys(definitions).forEach((key) => {
        for (let i = index; i < newValues.length; i++) {
          setMetaInjection(
            { field: key, listProperties: { listKey: field, listIndex: i } },
            getMetaInjection(
              getListInjectionKey({
                field: key,
                listProperties: { listKey: field, listIndex: i + 1 },
              }),
            ),
          );
        }
        setMetaInjection(
          { field: key, listProperties: { listKey: field, listIndex: newValues.length } },
          undefined,
        );
      });
    });
  };

  return (
    <Flex
      w="100%"
      overflow="hidden"
      direction="column"
      transition={EXPAND_TRANSITION}
      {...getFlexProps(expanded)}>
      {values.length === 0 ? (
        <Center>
          <CFCaption>{translate(UI_Words["list-field-empty-caption"], lang)}</CFCaption>
        </Center>
      ) : (
        <Flex
          flex={1}
          direction="column"
          overflowX="hidden"
          overflowY="auto"
          ml="32px"
          my="8px"
          gap={`${gap}px`}
          sx={useScrollBarSx()}>
          {values.map((pack, index) => {
            const keyId = `${field}-${pack[ID_KEY]}`;
            const listProperties: IListProperties = { listKey: field, listIndex: index };
            const definitions = getDefinitions(pack, index);
            const displayKey = getDisplayKey?.(pack, index) ?? Object.keys(definitions)[0];
            const picked = definitions[displayKey];
            let displayItem: string;
            if (isUndefined(picked)) {
              Logger.warn(`displayKey '${displayKey}' not found`);
              displayItem = "unknown";
            } else {
              const value = values[index][displayKey];
              switch (picked.type) {
                case "boolean":
                  displayItem = value ? "True" : "False";
                  break;
                case "color":
                case "image":
                case "text":
                case "select":
                  displayItem = value;
                  break;
                case "number":
                  displayItem = value.toString();
                  break;
                default:
                  Logger.warn(`unknown type '${picked.type}'`);
                  displayItem = "";
                  break;
              }
              if (!isString(displayItem)) {
                displayItem = parseIStr(displayItem);
              }
              if (!displayItem) {
                displayItem = translate(UI_Words["list-field-display-not-specified-caption"], lang);
              }
            }
            const itemKey = `${parseIStr(picked.label ?? titleCaseWord(displayKey))}: `;
            return (
              <Popover key={`${keyId}-${index}`} isLazy lazyBehavior="unmount">
                <Flex h={DEFAULT_FIELD_H} align="center" flexShrink={0}>
                  <PopoverTrigger>
                    <Flex w="100%" tabIndex={0}>
                      <Image {...iconProps} src={SettingsIcon} />
                      <Center flex={1}>
                        <CFText fontWeight={600}>{itemKey}</CFText>
                        <Box w="4px" />
                        <CFText>{displayItem}</CFText>
                      </Center>
                    </Flex>
                  </PopoverTrigger>
                  <Image
                    {...iconProps}
                    src={MinusIcon}
                    onClick={() => onDelete(index, definitions)}
                  />
                </Flex>
                <CFPopoverContent w="400px" usePortal>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader>
                    {translate(UI_Words["list-field-settings-header"], lang)}
                  </PopoverHeader>
                  <Flex
                    ml="8px"
                    mr="12px"
                    my="8px"
                    flexShrink={0}
                    direction="column"
                    gap={`${gap}px`}>
                    {Object.entries(definitions).map(([key, item]) => {
                      item = shallowCopy(item);
                      item.inList = true;

                      return (
                        <Field
                          key={`${keyId}-${key}-${index}`}
                          gap={gap}
                          definition={item}
                          field={key}
                          listProperties={listProperties}
                        />
                      );
                    })}
                  </Flex>
                </CFPopoverContent>
              </Popover>
            );
          })}
        </Flex>
      )}
    </Flex>
  );
};
ListBody = observer(ListBody);

interface IList extends IListBody, Omit<FlexProps, "gap"> {
  totalH: number;
  getNewItem: () => IListItem;
  setExpanded: (expanded: boolean) => void;
  label?: string;
  tooltip?: string;
}
const List = ({
  totalH,
  getNewItem,
  setExpanded,
  label,
  tooltip,
  field,
  values,
  expanded,
  getFlexProps,
  getDefinitions,
  gap = DEFAULT_GAP,
  getDisplayKey,
  ...props
}: IList) => {
  const lang = langStore.tgt;

  const onAdd = () => {
    setExpanded(true);
    setMetaField({ field }, [...values, getNewItem()]);
  };

  return (
    <Flex
      w="100%"
      h={`${expanded ? totalH : DEFAULT_FIELD_H}px`}
      direction="column"
      transition={EXPAND_TRANSITION}
      {...props}>
      <Flex w="100%" h={`${DEFAULT_FIELD_H}px`} flexShrink={0} align="center">
        <CFTooltip label={tooltip}>
          <Flex w="100%" h="100%" align="center" as="button" onClick={() => setExpanded(!expanded)}>
            <CFIcon
              svg={ArrowDownIcon}
              squared={false}
              className={block({ e: "icon", m: expanded ? "expanded" : "folded" })}
              fillbyCurrentColor
              transition={EXPAND_TRANSITION}
            />
            {label && (
              <CFText ml="6px" fontWeight={500}>
                {label}
              </CFText>
            )}
            <Spacer />
          </Flex>
        </CFTooltip>
        <CFTooltip label={translate(UI_Words["add-object-to-list-tooltip"], lang)}>
          <Image {...iconProps} src={AddIcon} onClick={onAdd} />
        </CFTooltip>
      </Flex>
      <ListBody
        field={field}
        values={values}
        expanded={expanded}
        getFlexProps={getFlexProps}
        getDefinitions={getDefinitions}
        gap={gap}
        getDisplayKey={getDisplayKey}
      />
    </Flex>
  );
};

export default observer(List);
