import type { AvailablePlugins, IMakePlugin } from "@/schema/plugins";

export const reactPluginSettings: IMakePlugin<AvailablePlugins>[] = [
  {
    type: "settings",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 400,
        src: "https://user-images.githubusercontent.com/15677328/234536549-87e94432-9f25-490f-8dee-7ed166bcbeed.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234536679-103c6d6a-f882-4a99-baaf-02f71fefeea5.svg",
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
        w: 300,
        h: 225,
        offsetY: 120,
        src: "https://user-images.githubusercontent.com/15677328/234536800-4e2d9090-8958-4da9-8600-1e708f86759a.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234537027-20b3ea26-a6d0-4e07-8186-e2649917a893.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234537508-b7ef4494-f2db-438b-b7cb-2f8d04833cb0.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234537560-552bc9bc-b0dc-45a5-af77-f14a2f2dbf80.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234533823-12d27a77-155a-4743-a0af-1fc5b86014fd.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234537900-4f52af0b-3be0-4a9a-b70b-ec28198323f0.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234538170-7374b2a1-edac-45c5-9615-96adf310a4c4.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234545067-1da07d56-9d53-4fbb-83cc-395ff953b4c6.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234545700-0d33471a-b43b-47af-a371-b2b3b8a98794.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234545875-ff953782-7a18-4e0a-997c-37522fcbd2fd.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234545341-870f888e-0dfc-4d8e-a79b-fcb9ddbe0977.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234538371-88891a34-1b30-4c2b-bd2e-a80e2030210d.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234538604-3017a411-e5f1-4564-8bc0-5090e973d86b.svg",
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
        src: "https://user-images.githubusercontent.com/15677328/234538781-b59b514f-99be-4ca2-859d-601f024cd7e0.svg",
        tooltip: "email-tooltip",
        pivot: "rb",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
];
