import type { AvailablePlugins, IMakePlugin } from "@/schema/plugins";

export const reactPluginSettings: IMakePlugin<AvailablePlugins>[] = [
  {
    type: "settings",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 400,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/49223052f17f4f249c56ba00f43b3043.png",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "project",
    props: {
      offsetY: 64,
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 400,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/255c1c20b5754815b759969218f8a87c.png",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "add",
    props: {
      p: "14px",
      offsetY: 120,
      nodeConstraint: "none",
      renderInfo: {
        w: 300,
        h: 225,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/81a82eca03224bc2bb8de65c08f2f48a.png",
        pivot: "rt",
        follow: false,
      },
      pluginInfo: {},
    },
  },
  {
    type: "arrange",
    props: {
      offsetY: 48,
      nodeConstraint: "multiNode",
      renderInfo: {
        w: 0,
        h: 0,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/7fcc3fb8a25248b0a1f2ca68b0c975f4.png",
        pivot: "rt",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "undo",
    props: {
      p: "14px",
      offsetX: -28,
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/069122c037d34d97ba10157438af131b.png",
        pivot: "top",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "redo",
    props: {
      p: "14px",
      offsetX: 28,
      nodeConstraint: "none",
      renderInfo: {
        w: 0,
        h: 0,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/4c0b2343838344fdb574520006aa83c9.png",
        pivot: "top",
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
  {
    type: "download",
    props: {
      offsetY: -48,
      nodeConstraint: "anyNode",
      renderInfo: {
        w: 220,
        h: 230,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/d871d80a875146fa8aabc09fbbdef47e.png",
        pivot: "rb",
        follow: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "textEditor",
    props: {
      p: "13px",
      nodeConstraint: "text",
      renderInfo: {
        w: 300,
        h: 400,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/06dc5af9d77944c8ae06d1ae1124b6a2.png",
        pivot: "right",
        follow: true,
      },
      pluginInfo: {},
    },
  },
  {
    type: "groupEditor",
    props: {
      // p: "13px",
      nodeConstraint: "group",
      renderInfo: {
        w: 0,
        h: 0,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/b767f4a99956498a922470174a2051df.png",
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
      // p: "13px",
      nodeConstraint: "multiNode",
      renderInfo: {
        w: 0,
        h: 0,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/669c405bee944a9a91fc4aa68f858cc3.png",
        pivot: "rt",
        follow: true,
      },
      pluginInfo: {},
      noExpand: true,
    },
  },
];
