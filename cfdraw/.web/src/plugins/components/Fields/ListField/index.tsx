import { Fragment, useState } from "react";
import { observer } from "mobx-react-lite";
import { Center, Flex, Image, Spacer } from "@chakra-ui/react";

import { Dictionary } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IField, IListProperties } from "@/schema/plugins";
import type { IDefinitions, IListField } from "@/schema/fields";
import "./index.scss";
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

function getDefaults(item: IDefinitions): Dictionary<any> {
  const defaults: Dictionary<any> = {};
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

  const itemRows = Object.keys(definition.item).length;
  definition.numRows = Math.max(1, Math.min(values.length * itemRows, definition.maxNumRows ?? 4));
  const expandH = getFieldH({ gap, definition, field });
  definition.numRows = 1;
  const fieldH = getFieldH({ gap, definition, field });
  const totalH = fieldH + gap + expandH;

  const onAdd = () => {
    setMetaField(fieldKeys, [...values, getDefaults(definition.item)]);
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
        mt={`${expanded ? gap : 0}px`}
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
            {values.map((_, index) => {
              const listProperties: IListProperties = { listKey: field, listIndex: index };
              return (
                <Flex key={`${field}-${index}`} mr="12px" flexShrink={0} direction="column">
                  {Object.entries(definition.item).map(([key, item]) => (
                    <Field
                      key={`${key}-${index}`}
                      gap={gap}
                      definition={item}
                      field={key}
                      listProperties={listProperties}
                    />
                  ))}
                  {index !== values.length - 1 && <CFDivider my={`${gap}px`} />}
                </Flex>
              );
            })}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default observer(ListField);
