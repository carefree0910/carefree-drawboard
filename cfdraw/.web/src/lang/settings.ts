import { Lang } from "@carefree0910/core";

export enum CFDraw_Settings_Words {
  "plugins-header" = "plugins-header",
  "hide-all-plugins-message" = "hide-all-plugins-message",
  "show-all-plugins-message" = "show-all-plugins-message",
}

export const settingsLangRecords: Record<Lang, Record<CFDraw_Settings_Words, string>> = {
  zh: {
    [CFDraw_Settings_Words["plugins-header"]]: "插件",
    [CFDraw_Settings_Words["hide-all-plugins-message"]]: "隐藏所有",
    [CFDraw_Settings_Words["show-all-plugins-message"]]: "显示所有",
  },
  en: {
    [CFDraw_Settings_Words["plugins-header"]]: "Plugins",
    [CFDraw_Settings_Words["hide-all-plugins-message"]]: "Hide All",
    [CFDraw_Settings_Words["show-all-plugins-message"]]: "Show All",
  },
};
