import { observer } from "mobx-react-lite";
import { Box, Checkbox, Flex } from "@chakra-ui/react";

import { Lang } from "@carefree0910/core";
import {
  langDescriptions,
  langStore,
  switchLangTo,
  translate,
  useIsReady,
} from "@carefree0910/business";
import {
  CFButton,
  CFSelect,
  CFDivider,
  CFHeading,
  CFSlider,
  useGlobalScale,
  Settings_Words,
} from "@carefree0910/components";

import { allReactPlugins, IPlugin } from "@/schema/plugins";
import { Plugins_Words } from "@/lang/plugins";
import { CFDraw_Settings_Words } from "@/lang/settings";
import { stripHashFromIdentifier } from "@/utils/misc";
import { uiStore } from "@/stores/ui";
import { usePythonPluginSettings } from "@/stores/settings";
import {
  useReactPluginIsVisible,
  usePythonPluginIsVisible,
  setPythonPluginVisible,
  setReactPluginVisible,
  usePluginIds,
} from "@/stores/pluginsInfo";
import { parseIStr } from "@/actions/i18n";
import { hideAllPlugins, showAllPlugins } from "@/actions/managePlugins";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

interface LangOption {
  value: Lang;
  label: string;
}
const SettingsPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("settings").id;
  const lang = langStore.tgt;
  const commonProps = { fontWeight: 400, size: "md" };
  const disablePluginSettings = uiStore.disablePluginSettings;
  const { scale, minScale, maxScale, onScaleChange } = useGlobalScale();

  const selected = { value: lang, label: langDescriptions[lang] };
  const options: LangOption[] = Object.keys(langDescriptions).map((lang) => ({
    value: lang as Lang,
    label: langDescriptions[lang as Lang],
  }));

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        {/* language settings */}
        <Box mt="12px">
          <CFHeading>语言 / Language</CFHeading>
          <CFDivider />
          <CFSelect<Lang, false>
            boxProps={{ mt: "16px" }}
            value={selected}
            options={options}
            onChange={(e) => {
              if (!!e) {
                switchLangTo(e.value);
              }
            }}
          />
        </Box>
        {/* globalScale settings */}
        {useIsReady() && (
          <Box mt="24px">
            <CFHeading>{translate(Settings_Words["global-scale-header"], lang)}</CFHeading>
            <CFDivider />
            <CFSlider
              min={minScale}
              max={maxScale}
              step={0.001}
              value={scale}
              scale="logarithmic"
              onSliderChange={onScaleChange}
            />
          </Box>
        )}
        {/* plugin visible settings */}
        <Box mt="12px" pb="12px">
          <CFHeading>{translate(CFDraw_Settings_Words["plugins-header"], lang)}</CFHeading>
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
                {translate(CFDraw_Settings_Words["hide-all-plugins-message"], lang)}
              </CFButton>
              <CFButton onClick={() => showAllPlugins()} isDisabled={disablePluginSettings}>
                {translate(CFDraw_Settings_Words["show-all-plugins-message"], lang)}
              </CFButton>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("settings", true)(observer(SettingsPlugin));
