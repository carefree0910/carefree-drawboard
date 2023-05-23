import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Center,
  Flex,
  Image,
  Portal,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import "./index.scss";
import ImageIcon from "@/assets/icons/image.svg";
import { ReactComponent as ArrowDownIcon } from "@/assets/icons/arrow-down.svg";

import type { IField } from "@/schema/plugins";
import type { IImageField } from "@/schema/fields";
import { UI_Words } from "@/lang/ui";
import { genBlock } from "@/utils/bem";
import { titleCaseWord } from "@/utils/misc";
import { EXPAND_TRANSITION } from "@/utils/constants";
import { themeStore } from "@/stores/theme";
import { getMetaField, setMetaField } from "@/stores/meta";
import { parseIStr } from "@/actions/i18n";
import CFIcon from "@/components/CFIcon";
import CFText from "@/components/CFText";
import CFTooltip, { CFFormLabel } from "@/components/CFTooltip";
import { useDefaultFieldValue } from "../utils";

const block = genBlock("c-image-field");
function ImageField({ definition, ...fieldKeys }: IField<IImageField>) {
  useDefaultFieldValue({ definition, ...fieldKeys });
  const id = getRandomHash().toString();
  const label = parseIStr(definition.label ?? titleCaseWord(fieldKeys.field));
  const tooltip = parseIStr(definition.tooltip ?? "");
  const lang = langStore.tgt;
  const { panelBg } = themeStore.styles;
  const [value, setValue] = useState(getMetaField(fieldKeys) ?? definition.default);
  const [expanded, setExpanded] = useState(false);

  const onExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Flex w="100%" align="center" {...definition.props}>
      <CFFormLabel label={label} tooltip={{ label: tooltip }} />
      <CFTooltip label={<Image my="6px" src={value} />}>
        <CFText flex={1} noOfLines={1}>
          {value}
        </CFText>
      </CFTooltip>
      <Popover>
        <PopoverTrigger>
          <Center as="button" h="100%" position="relative" onClick={onExpand}>
            <CFTooltip label={translate(UI_Words["image-field-image-picker"], lang)}>
              <Flex>
                <Image src={ImageIcon} />
                <CFIcon
                  svg={ArrowDownIcon}
                  squared={false}
                  className={block({ e: "icon", m: expanded ? "expanded" : "folded" })}
                  fillbyCurrentColor
                  transition={EXPAND_TRANSITION}
                />
              </Flex>
            </CFTooltip>
          </Center>
        </PopoverTrigger>
        <Portal>
          <PopoverContent w="320px" h="320px" bg={`${panelBg}cc`}></PopoverContent>
        </Portal>
      </Popover>
    </Flex>
  );
}

export default observer(ImageField);
