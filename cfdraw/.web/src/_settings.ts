import type { ReactPlugins, IMakePlugin } from "@/schema/plugins";

import { settingsStore } from "./stores/settings";
import {
  ADD_ICON,
  ARRANGE_ICON,
  BRUSH_ICON,
  DELETE_ICON,
  DOWNLOAD_ICON,
  EMAIL_ICON,
  GITHUB_ICON,
  GROUP_EDITOR_ICON,
  META_ICON,
  MULTI_EDITOR_ICON,
  PROJECT_ICON,
  REDO_ICON,
  SETTINGS_ICON,
  TEXT_EDITOR_ICON,
  UNDO_ICON,
  WIKI_ICON,
} from "./utils/constants";

export const reactPluginSettings: IMakePlugin<ReactPlugins>[] = [
  {
    type: "settings",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 400,
        src: SETTINGS_ICON,
        tooltip: "settings-tooltip",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "project",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 400,
        offsetY: 64,
        src: PROJECT_ICON,
        tooltip: "project-management-tooltip",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "add",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 256,
        h: 120,
        offsetY: 120,
        src: ADD_ICON,
        tooltip: "add-new-stuff-tooltip",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "brush",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 220,
        offsetY: 176,
        src: BRUSH_ICON,
        tooltip: "enter-sketch-mode-tooltip",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "undo",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        offsetX: -28,
        src: UNDO_ICON,
        tooltip: "undo-tooltip",
        pivot: "top",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "redo",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        offsetX: 28,
        src: REDO_ICON,
        tooltip: "redo-tooltip",
        pivot: "top",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "meta",
    props: {
      nodeConstraint: "singleNode",
      renderInfo: {
        w: 400,
        h: 400,
        offsetY: 48,
        src: META_ICON,
        pivot: "rt",
        follow: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "download",
    props: {
      nodeConstraint: "anyNode",
      renderInfo: {
        w: 240,
        h: 230,
        offsetY: -48,
        src: DOWNLOAD_ICON,
        pivot: "rb",
        follow: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "delete",
    props: {
      nodeConstraint: "anyNode",
      renderInfo: {
        w: 0,
        h: 0,
        offsetY: -48,
        src: DELETE_ICON,
        pivot: "lb",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "textEditor",
    props: {
      nodeConstraint: "text",
      renderInfo: {
        w: 300,
        h: 400,
        src: TEXT_EDITOR_ICON,
        tooltip: "text-editor-tooltip",
        pivot: "right",
        follow: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "groupEditor",
    props: {
      nodeConstraint: "group",
      renderInfo: {
        w: 0,
        h: 0,
        src: GROUP_EDITOR_ICON,
        tooltip: "ungroup-the-nodes-tooltip",
        pivot: "rt",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "multiEditor",
    props: {
      nodeConstraint: "multiNode",
      renderInfo: {
        w: 0,
        h: 0,
        src: MULTI_EDITOR_ICON,
        tooltip: "group-the-nodes-tooltip",
        pivot: "rt",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "arrange",
    props: {
      nodeConstraint: "multiNode",
      renderInfo: {
        w: 0,
        h: 0,
        offsetY: 48,
        src: ARRANGE_ICON,
        tooltip: "auto-arrange-tooltip",
        pivot: "rt",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "wiki",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        src: WIKI_ICON,
        tooltip: "wiki-tooltip",
        pivot: "rb",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "github",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        offsetX: -61,
        src: GITHUB_ICON,
        tooltip: "github-tooltip",
        pivot: "rb",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "email",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        offsetX: -120,
        src: EMAIL_ICON,
        tooltip: "email-tooltip",
        pivot: "rb",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
];
export function useReactPluginSettings() {
  const exclude = settingsStore.boardSettings?.globalSettings?.excludeReactPlugins;
  return reactPluginSettings.filter(({ type }) => !exclude?.includes(type));
}
