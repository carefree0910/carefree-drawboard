import { Lang } from "@noli/core";

export enum Settings_Words {
  "plugins-header" = "plugins-header",
}

export const settingsLangRecords: Record<Lang, Record<Settings_Words, string>> = {
  zh: {
    [Settings_Words["plugins-header"]]: "插件",
  },
  en: {
    [Settings_Words["plugins-header"]]: "Plugins",
  },
};
