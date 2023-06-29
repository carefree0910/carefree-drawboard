import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Flex, Image, ImageProps, Spacer } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import "./index.scss";
import AddIcon from "@/assets/icons/add.svg";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";

import type { IField } from "@/schema/plugins";
import type { IDefinitions, IListField } from "@/schema/fields";
import { genBlock } from "@/utils/bem";
import { titleCaseWord } from "@/utils/misc";
import { DEFAULT_FIELD_H, EXPAND_TRANSITION } from "@/utils/constants";
import { UI_Words } from "@/lang/ui";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFIcon from "@/components/CFIcon";
import CFText from "@/components/CFText";
import CFTooltip from "@/components/CFTooltip";
import { getFieldH, useDefaultFieldValue } from "../utils";
import List, { ID_KEY, IListItem } from "./List";

function getDefaults(item: IDefinitions): IListItem {
  const defaults: IListItem = { [ID_KEY]: getRandomHash().toString() };
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
  const values: IListItem[] | undefined = getMetaField(fieldKeys);

  if (!values) return null;

  const iconProps: ImageProps = { w: "24px", h: "24px", cursor: "pointer" };

  definition.numRows = Math.max(1, Math.min(values.length, definition.maxNumRows ?? 4) + 0.5);
  const expandH = getFieldH({ gap, definition, field });
  const totalH = DEFAULT_FIELD_H + gap + expandH;

  const onAdd = () => {
    setExpanded(true);
    setMetaField(fieldKeys, [...values, getDefaults(definition.item)]);
  };

  return (
    <Flex
      w="100%"
      h={`${expanded ? totalH : DEFAULT_FIELD_H}px`}
      direction="column"
      transition={EXPAND_TRANSITION}
      {...definition.props}>
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
      <List
        field={field}
        values={values}
        expanded={expanded}
        getFlexProps={(expanded) =>
          expanded
            ? {
                h: `${expandH}px`,
                mt: "6px",
              }
            : {
                h: "0px",
                mt: "0px",
              }
        }
        getDefinitions={() => definition.item}
        gap={gap}
        getDisplayKey={() => definition.displayKey}
      />
    </Flex>
  );
}

export default observer(ListField);
