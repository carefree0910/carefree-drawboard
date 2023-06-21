import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { useState } from "react";
import {
  Box,
  Center,
  Flex,
  Image,
  ImageProps,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spacer,
} from "@chakra-ui/react";

import { Dictionary, Logger, getRandomHash, isString, isUndefined } from "@carefree0910/core";
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
import { EXPAND_TRANSITION } from "@/utils/constants";
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
import { getFieldH, useDefaultFieldValue } from "../utils";
import { Field } from "../Field";

export const ID_KEY = "^_^__id__^_^";
function getDefaults(item: IDefinitions): Dictionary<any> {
  const defaults: Dictionary<any> = { [ID_KEY]: getRandomHash() };
  for (const [key, value] of Object.entries(item)) {
    defaults[key] = value.default;
  }
  return defaults;
}

const block = genBlock("c-list-field");
function ListField({ definition, gap, ...fieldKeys }: IField<IListField> & { gap: number }) {
  if (!!fieldKeys.listProperties) {
    throw Error("should not use `ListField` inside another `ListField`");
  }
  useDefaultFieldValue({ definition, ...fieldKeys });
  const field = fieldKeys.field;
  const label = parseIStr(definition.label ?? titleCaseWord(field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [expanded, setExpanded] = useState(false);

  const lang = langStore.tgt;
  const values: any[] | undefined = getMetaField(fieldKeys);

  if (!values) return null;

  const iconProps: ImageProps = { w: "24px", h: "24px", cursor: "pointer" };

  definition.numRows = Math.max(1, Math.min(values.length, definition.maxNumRows ?? 4) + 0.5);
  const expandH = getFieldH({ gap, definition, field });
  definition.numRows = 1;
  const fieldH = getFieldH({ gap, definition, field });
  const totalH = fieldH + gap + expandH;

  const onAdd = () => {
    setMetaField(fieldKeys, [...values, getDefaults(definition.item)]);
  };
  const onDelete = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    setMetaField(fieldKeys, newValues);
    runInAction(() => {
      Object.keys(definition.item).forEach((key) => {
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
      h={`${expanded ? totalH : fieldH}px`}
      direction="column"
      transition={EXPAND_TRANSITION}
      {...definition.props}>
      <Flex w="100%" h={`${fieldH}px`} flexShrink={0} align="center">
        <CFTooltip label={tooltip}>
          <Flex w="100%" h="100%" align="center" as="button" onClick={() => setExpanded(!expanded)}>
            <CFIcon
              svg={ArrowDownIcon}
              squared={false}
              className={block({ e: "icon", m: expanded ? "expanded" : "folded" })}
              fillbyCurrentColor
              transition={EXPAND_TRANSITION}
            />
            <CFText ml="6px" fontWeight={500}>
              {label}
            </CFText>
            <Spacer />
          </Flex>
        </CFTooltip>
        <CFTooltip label={translate(UI_Words["add-object-to-list-tooltip"], lang)}>
          <Image {...iconProps} src={AddIcon} onClick={onAdd} />
        </CFTooltip>
      </Flex>
      <Flex
        w="100%"
        h={`${expanded ? expandH : 0}px`}
        mt={`${expanded ? 6 : 0}px`}
        overflow="hidden"
        direction="column"
        transition={EXPAND_TRANSITION}>
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
              let displayKey = definition.displayKey;
              let displayItem: string;
              if (isUndefined(displayKey)) {
                displayKey = Object.keys(definition.item)[0];
              }
              const picked = definition.item[displayKey];
              if (isUndefined(picked)) {
                Logger.warn(`displayKey '${displayKey}' not found`);
                displayItem = label;
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
                  displayItem = translate(
                    UI_Words["list-field-display-not-specified-caption"],
                    lang,
                  );
                }
              }
              const itemKey = `${parseIStr(picked.label ?? titleCaseWord(displayKey))}: `;
              return (
                <Popover key={`${keyId}-${index}`} isLazy lazyBehavior="unmount">
                  <Flex h={fieldH} align="center" flexShrink={0}>
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
                    <Image {...iconProps} src={MinusIcon} onClick={() => onDelete(index)} />
                  </Flex>
                  <PopoverContent w="400px">
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
                      {Object.entries(definition.item).map(([key, item]) => (
                        <Field
                          key={`${keyId}-${key}-${index}`}
                          gap={gap}
                          definition={item}
                          field={key}
                          listProperties={listProperties}
                        />
                      ))}
                    </Flex>
                  </PopoverContent>
                </Popover>
              );
            })}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default observer(ListField);
