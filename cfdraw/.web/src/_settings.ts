import type { ReactPlugins, IMakePlugin } from "@/schema/plugins";

import SettingsIcon from "@/assets/icons/settings.svg";
import ProjectIcon from "@/assets/icons/project.svg";
import AddIcon from "@/assets/icons/add.svg";
import BrushIcon from "@/assets/icons/brush.svg";
import UndoIcon from "@/assets/icons/undo.svg";
import RedoIcon from "@/assets/icons/redo.svg";
import MetaIcon from "@/assets/icons/meta.svg";
import DownloadIcon from "@/assets/icons/download.svg";
import DeleteIcon from "@/assets/icons/delete.svg";
import EditorIcon from "@/assets/icons/editor.svg";
import GroupEditorIcon from "@/assets/icons/group-editor.svg";
import MultiEditorIcon from "@/assets/icons/multi-editor.svg";
import ArrangeIcon from "@/assets/icons/arrange.svg";
import WikiIcon from "@/assets/icons/wiki.svg";
import EmailIcon from "@/assets/icons/email.svg";
import GitHubIcon from "@/assets/icons/github.svg";
import ShortcutsIcon from "@/assets/icons/shortcuts.svg";

import { settingsStore } from "./stores/settings";

export const reactPluginSettings: IMakePlugin<ReactPlugins | "_python.pluginGroup">[] = [
  {
    type: "settings",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 400,
        src: SettingsIcon,
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
        src: ProjectIcon,
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
        w: 320,
        h: 190,
        offsetY: 120,
        src: AddIcon,
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
        src: BrushIcon,
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
        src: UndoIcon,
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
        src: RedoIcon,
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
        src: MetaIcon,
        pivot: "rt",
        follow: true,
        keepOpen: true,
        tooltip: {
          zh: "显示 Meta 数据",
          en: "Show Meta Data",
        },
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
        src: DownloadIcon,
        pivot: "rb",
        follow: true,
        keepOpen: true,
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
        src: DeleteIcon,
        pivot: "lb",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "basicEditor",
    props: {
      nodeConstraintRules: {
        some: ["path", "rectangle", "group", "frame"],
      },
      renderInfo: {
        w: 408,
        h: 1.0,
        src: EditorIcon,
        tooltip: "basic-editor-tooltip",
        pivot: "right",
        follow: true,
        keepOpen: true,
        expandPivot: "right",
        useModal: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "textEditor",
    props: {
      nodeConstraint: "text",
      renderInfo: {
        w: 408,
        h: 1.0,
        src: EditorIcon,
        tooltip: "text-editor-tooltip",
        pivot: "right",
        follow: true,
        keepOpen: true,
        expandPivot: "right",
        useModal: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "imageEditor",
    props: {
      nodeConstraint: "image",
      renderInfo: {
        w: 408,
        h: 1.0,
        src: EditorIcon,
        tooltip: "image-editor-tooltip",
        pivot: "right",
        follow: true,
        keepOpen: true,
        expandPivot: "right",
        useModal: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "svgEditor",
    props: {
      nodeConstraint: "svg",
      renderInfo: {
        w: 408,
        h: 1.0,
        src: EditorIcon,
        tooltip: "svg-editor-tooltip",
        pivot: "right",
        follow: true,
        keepOpen: true,
        expandPivot: "right",
        useModal: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "noliFrameEditor",
    props: {
      nodeConstraint: "noliFrame",
      renderInfo: {
        w: 408,
        h: 1.0,
        src: EditorIcon,
        tooltip: "noliFrame-editor-tooltip",
        pivot: "right",
        follow: true,
        keepOpen: true,
        expandPivot: "right",
        useModal: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "noliTextFrameEditor",
    props: {
      nodeConstraint: "noliTextFrame",
      renderInfo: {
        w: 408,
        h: 1.0,
        src: EditorIcon,
        tooltip: "noliTextFrame-editor-tooltip",
        pivot: "right",
        follow: true,
        keepOpen: true,
        expandPivot: "right",
        useModal: true,
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
        src: GroupEditorIcon,
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
        src: MultiEditorIcon,
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
        src: ArrangeIcon,
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
        src: WikiIcon,
        tooltip: "wiki-tooltip",
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
        src: EmailIcon,
        tooltip: "email-tooltip",
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
        src: GitHubIcon,
        tooltip: "github-tooltip",
        pivot: "rb",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "shortcuts",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 400,
        h: 400,
        src: ShortcutsIcon,
        tooltip: "shortcuts-tooltip",
        pivot: "lb",
      },
      pluginInfo: {},
    },
  },
];
export function useReactPluginSettings() {
  const exclude = settingsStore.boardSettings?.globalSettings?.excludeReactPlugins;
  const builtins = reactPluginSettings.filter(({ type }) => !exclude?.includes(type));
  const extraPlugins = settingsStore.extraPlugins;
  if (extraPlugins) {
    if (extraPlugins.logo) {
      builtins.push(extraPlugins.logo);
    }
  }
  return builtins;
}
