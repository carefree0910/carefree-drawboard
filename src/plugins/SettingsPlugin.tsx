import { observer } from "mobx-react-lite";
import { Box, Checkbox, Flex } from "@chakra-ui/react";

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
import { Plugins_Words } from "@/lang/plugins";
import { Settings_Words } from "@/lang/settings";
import { stripHashFromIdentifier } from "@/utils/misc";
import { isInvisible, pythonIsInvisible, setPythonVisible, setVisible } from "@/stores/plugins";
import CFSelect from "@/components/CFSelect";
import CFSlider from "@/components/CFSlider";
import { CFDivider } from "@/components/CFDivider";
import { CFHeading } from "@/components/CFHeading";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";
import getPythonPluginSettings from "@/board/_python";

const SettingsPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const lang = langStore.tgt;
  const commonProps = { fontWeight: 400, size: "md" };

  return (
    <Render {...props}>
      <Flex w="100%" h="100%" mb="20px" direction="column">
        {/* plugin settings */}
        <Box>
          <CFHeading>{translate(Settings_Words["plugins-header"], lang)}</CFHeading>
          <CFDivider />
          <Flex w="100%" gap="8px" wrap="wrap" align="center" justifyContent="space-around">
            {allAvailablePlugins
              .filter((plugin) => !["settings", "undo", "redo"].includes(plugin))
              .map((plugin) => (
                <Checkbox
                  key={plugin}
                  value={plugin}
                  isChecked={!isInvisible(plugin)}
                  onChange={() => setVisible(plugin, isInvisible(plugin))}
                  {...commonProps}>
                  {translate(Plugins_Words[plugin], lang)}
                </Checkbox>
              ))}
            {getPythonPluginSettings().map((settings) => {
              const identifierWithHash = settings.props.pluginInfo.identifier;
              const identifier = stripHashFromIdentifier(identifierWithHash);
              const pIsInvisible = pythonIsInvisible(identifierWithHash);
              return (
                <Checkbox
                  key={identifierWithHash}
                  value={identifier}
                  isChecked={!pIsInvisible}
                  onChange={() => setPythonVisible(identifierWithHash, pIsInvisible)}
                  {...commonProps}>
                  {`${translate(Plugins_Words[settings.type], lang)} (${identifier})`}
                </Checkbox>
              );
            })}
          </Flex>
        </Box>
        {/* language settings */}
        <Box mt="24px">
          <CFHeading>语言 / Language</CFHeading>
          <CFDivider />
          <CFSelect
            flex={1}
            value={lang}
            options={Object.keys(langDescriptions)}
            optionConverter={(lang: string) => langDescriptions[lang as Lang]}
            onOptionClick={(lang: string) => switchLangTo(lang as Lang)}
          />
        </Box>
        {/* globalScale settings */}
        {useIsReady() && (
          <Box mt="24px">
            <CFHeading>{translate(Settings_Words["global-scale-header"], lang)}</CFHeading>
            <CFDivider />
            <CFSlider
              min={BoardStore.board.options.minScale}
              max={BoardStore.board.options.maxScale}
              step={0.001}
              value={useGlobalTransform().globalScale}
              scale="logarithmic"
              onSliderChange={(value) => BoardStore.api.setGlobalScale(value)}
            />
          </Box>
        )}
      </Flex>
    </Render>
  );
};

const _ = observer(SettingsPlugin);
drawboardPluginFactory.register("settings")(_);
export default _;
