import { Lang } from "@noli/core";

export enum Settings_Words {
  "plugins-header" = "plugins-header",
  "global-scale-header" = "global-scale-header",
}

export const settingsLangRecords: Record<Lang, Record<Settings_Words, string>> = {
  zh: {
    [Settings_Words["plugins-header"]]: "插件",
    [Settings_Words["global-scale-header"]]: "全局缩放",
  },
  en: {
    [Settings_Words["plugins-header"]]: "Plugins",
    [Settings_Words["global-scale-header"]]: "Global Scale",
  },
};
