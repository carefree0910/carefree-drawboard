import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Box, Checkbox, Flex } from "@chakra-ui/react";

import { getRandomHash, Lang } from "@carefree0910/core";
import {
  langDescriptions,
  langStore,
  switchLangTo,
  translate,
  useIsReady,
} from "@carefree0910/business";

import { allReactPlugins, IPlugin } from "@/schema/plugins";
import { Plugins_Words } from "@/lang/plugins";
import { Settings_Words } from "@/lang/settings";
import { stripHashFromIdentifier } from "@/utils/misc";
import { uiStore } from "@/stores/ui";
import { usePythonPluginSettings } from "@/stores/settings";
import {
  useReactPluginIsVisible,
  usePythonPluginIsVisible,
  setPythonPluginVisible,
  setReactPluginVisible,
} from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { hideAllPlugins, showAllPlugins } from "@/actions/managePlugins";
import CFButton from "@/components/CFButton";
import CFSelect from "@/components/CFSelect";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { CFGlobalScaleSlider } from "@/components/CFSlider";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const SettingsPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `settings_${getRandomHash()}`, []);
  const lang = langStore.tgt;
  const commonProps = { fontWeight: 400, size: "md" };
  const disablePluginSettings = uiStore.disablePluginSettings;

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        {/* language settings */}
        <Box mt="12px">
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
            <CFGlobalScaleSlider />
          </Box>
        )}
        {/* plugin visible settings */}
        <Box mt="12px" pb="12px">
          <CFHeading>{translate(Settings_Words["plugins-header"], lang)}</CFHeading>
          <CFDivider />
          <Flex w="100%" gap="8px" direction="column" justifyContent="space-around">
            {allReactPlugins
              .filter((plugin) => !["settings", "undo", "redo"].includes(plugin))
              .map((plugin, i) => {
                const pIsVisible = useReactPluginIsVisible(plugin);
                return (
                  <Checkbox
                    key={`plugin-${i}`}
                    value={plugin}
                    isChecked={pIsVisible}
                    onChange={() => setReactPluginVisible(plugin, !pIsVisible)}
                    {...commonProps}
                    disabled={disablePluginSettings}>
                    {translate(Plugins_Words[plugin], lang)}
                  </Checkbox>
                );
              })}
            {usePythonPluginSettings().map((settings, i) => {
              const identifierWithHash = settings.props.pluginInfo.identifier;
              const identifier = stripHashFromIdentifier(identifierWithHash);
              const pIsVisible = usePythonPluginIsVisible(identifierWithHash);
              return (
                <Checkbox
                  key={`${identifierWithHash}-${i}`}
                  value={identifier}
                  isChecked={pIsVisible}
                  onChange={() => setPythonPluginVisible(identifierWithHash, !pIsVisible)}
                  {...commonProps}
                  disabled={disablePluginSettings}>
                  {parseIStr(
                    settings.props.pluginInfo.name ??
                      `${translate(Plugins_Words[settings.type], lang)} (${identifier})`,
                  )}
                </Checkbox>
              );
            })}
            <Flex w="100%" my="6px" justifyContent="space-around">
              <CFButton onClick={() => hideAllPlugins()} isDisabled={disablePluginSettings}>
                {translate(Settings_Words["hide-all-plugins-message"], lang)}
              </CFButton>
              <CFButton onClick={() => showAllPlugins()} isDisabled={disablePluginSettings}>
                {translate(Settings_Words["show-all-plugins-message"], lang)}
              </CFButton>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("settings", true)(observer(SettingsPlugin));
