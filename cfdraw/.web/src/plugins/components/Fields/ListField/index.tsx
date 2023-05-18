import { Fragment, useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, Center, Flex, Image, Spacer } from "@chakra-ui/react";

import { Dictionary, getRandomHash } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IField, IListProperties } from "@/schema/plugins";
import type { IDefinitions, IListField } from "@/schema/fields";
import "./index.scss";
import DeleteIcon from "@/assets/icons/delete.svg";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";
import { genBlock } from "@/utils/bem";
import { titleCaseWord } from "@/utils/misc";
import { ADD_ICON, EXPAND_TRANSITION } from "@/utils/constants";
import { UI_Words } from "@/lang/ui";
import { themeStore, useScrollBarSx } from "@/stores/theme";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFIcon from "@/components/CFIcon";
import CFText from "@/components/CFText";
import CFDivider from "@/components/CFDivider";
import CFTooltip from "@/components/CFTooltip";
import { getFieldH, useDefaultFieldValue } from "../utils";
import { Field } from "../Field";

const ID_KEY = "^_^__id__^_^";
function getDefaults(item: IDefinitions): Dictionary<any> {
  const defaults: Dictionary<any> = { [ID_KEY]: getRandomHash() };
  for (const [key, value] of Object.entries(item)) {
    defaults[key] = value.default;
  }
  return defaults;
}

const block = genBlock("c-list-field");
function ListField({ definition, gap, ...fieldKeys }: IField<IListField> & { gap: number }) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const field = fieldKeys.field;
  const label = parseIStr(definition.label ?? titleCaseWord(field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const [expanded, setExpanded] = useState(false);

  const lang = langStore.tgt;
  const { captionColor } = themeStore.styles;
  const values: any[] | undefined = getMetaField(fieldKeys);

  if (!values) return null;

  const itemRows = Object.keys(definition.item).length + 1;
  definition.numRows = Math.max(1, Math.min(values.length * itemRows, definition.maxNumRows ?? 4));
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
              className={block({ e: "icon", m: expanded ? "expanded" : "folded" })}
              fillbyCurrentColor
              transition={EXPAND_TRANSITION}
            />
            <CFText ml="6px">{label}</CFText>
            <Spacer />
          </Flex>
        </CFTooltip>
        <CFTooltip label={translate(UI_Words["add-object-to-list-tooltip"], lang)}>
          <Image w="34px" h="34px" p="6px" src={ADD_ICON} cursor="pointer" onClick={onAdd} />
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
            <CFText color={captionColor}>
              {translate(UI_Words["list-field-empty-caption"], lang)}
            </CFText>
          </Center>
        ) : (
          <Flex
            flex={1}
            direction="column"
            overflowX="hidden"
            overflowY="auto"
            sx={useScrollBarSx()}>
            {values.map((pack, index) => {
              const keyId = `${field}-${pack[ID_KEY]}`;
              const isLast = index === values.length - 1;
              const listProperties: IListProperties = { listKey: field, listIndex: index };
              return (
                <Fragment key={`${keyId}-${index}`}>
                  <Flex mr="12px" flexShrink={0} direction="column">
                    {Object.entries(definition.item).map(([key, item]) => (
                      <Field
                        key={`${keyId}-${key}-${index}`}
                        gap={gap}
                        definition={item}
                        field={key}
                        listProperties={listProperties}
                      />
                    ))}
                    <Flex h="42px" mt={`${gap}px`}>
                      <Spacer />
                      <Box
                        as="button"
                        w="32px"
                        h="100%"
                        p="4px"
                        mx="4px"
                        onClick={() => onDelete(index)}>
                        <Image src={DeleteIcon} />
                      </Box>
                    </Flex>
                  </Flex>
                  {!isLast && (
                    <Box mr="12px">
                      <CFDivider my={`${gap}px`} />
                    </Box>
                  )}
                </Fragment>
              );
            })}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default observer(ListField);
