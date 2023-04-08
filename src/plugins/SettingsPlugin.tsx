import { observer } from "mobx-react-lite";
import { Box, Checkbox, Flex, Heading } from "@chakra-ui/react";

import type { Lang } from "@noli/core";
import {
  BoardStore,
  langDescriptions,
  langStore,
  switchLangTo,
  translate,
  useGlobalTransform,
  useIsReady,
} from "@noli/business";

import { allAvailablePlugins, IPlugin } from "@/types/plugins";
import { Plugins_Words } from "@/utils/lang/plugins";
import { Settings_Words } from "@/utils/lang/settings";
import { isInvisible, setVisible } from "@/stores/plugins";
import CFSelect from "@/components/CFSelect";
import CFSlider from "@/components/CFSlider";
import { CFDivider } from "@/components/CFDivider";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const SettingsPlugin = observer(({ node, ...props }: IPlugin) => {
  const lang = langStore.tgt;

  return (
    <Render {...props}>
      <Flex w="100%" h="100%" direction="column">
        {/* plugin settings */}
        <Box>
          <Heading size="sm">{translate(Settings_Words["plugins-header"], lang)}</Heading>
          <CFDivider />
          <Flex w="100%" gap="8px" wrap="wrap" align="center" justifyContent="space-around">
            {allAvailablePlugins
              .filter((plugin) => plugin !== "settings")
              .map((plugin) => (
                <Checkbox
                  key={plugin}
                  fontWeight={400}
                  size="md"
                  value={plugin}
                  isChecked={!isInvisible(plugin)}
                  onChange={() => setVisible(plugin, isInvisible(plugin))}>
                  {translate(Plugins_Words[plugin], lang)}
                </Checkbox>
              ))}
          </Flex>
        </Box>
        {/* language settings */}
        <Box mt="24px">
          <Heading size="sm">语言 / Language</Heading>
          <CFDivider />
          <CFSelect
            flex={1}
            w="100%"
            h="32px"
            pl="12px"
            fontSize="14px"
            itemSize="14px"
            iconProps={{ pr: "8px" }}
            value={langDescriptions[lang]}
            options={Object.keys(langDescriptions)}
            optionConverter={(lang: string) => langDescriptions[lang as Lang]}
            onOptionClick={(lang: string) => switchLangTo(lang as Lang)}
          />
        </Box>
        {/* globalScale settings */}
        {useIsReady() && (
          <Box mt="24px">
            <Heading size="sm">{translate(Settings_Words["global-scale-header"], lang)}</Heading>
            <CFDivider />
            <CFSlider
              min={BoardStore.board.options.minScale}
              max={BoardStore.board.options.maxScale}
              step={0.001}
              value={useGlobalTransform().globalScale}
              scale="logarithmic"
              onChange={(value) => BoardStore.api.setGlobalScale(value)}
            />
          </Box>
        )}
      </Flex>
    </Render>
  );
});
drawboardPluginFactory.register("settings")(SettingsPlugin);