import { Lang } from "@noli/core";

export enum Settings_Words {
  "plugins-header" = "plugins-header",
  "global-scale-header" = "global-scale-header",
  "hide-all-plugins-message" = "hide-all-plugins-message",
  "show-all-plugins-message" = "show-all-plugins-message",
}

export const settingsLangRecords: Record<Lang, Record<Settings_Words, string>> = {
  zh: {
    [Settings_Words["plugins-header"]]: "插件",
    [Settings_Words["global-scale-header"]]: "全局缩放",
    [Settings_Words["hide-all-plugins-message"]]: "隐藏所有",
    [Settings_Words["show-all-plugins-message"]]: "显示所有",
  },
  en: {
    [Settings_Words["plugins-header"]]: "Plugins",
    [Settings_Words["global-scale-header"]]: "Global Scale",
    [Settings_Words["hide-all-plugins-message"]]: "Hide All",
    [Settings_Words["show-all-plugins-message"]]: "Show All",
  },
};
