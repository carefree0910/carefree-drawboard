import type { AvailablePlugins, IMakePlugin } from "@/types/plugins";

export const reactPluginSettings: IMakePlugin<AvailablePlugins>[] = [
  {
    type: "txt2img.sd",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 600,
        h: 400,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/ec388e38bdac4f72978b895c2f686cdf.png",
        pivot: "left",
        follow: false,
        useModal: true,
        modalOpacity: 0.9,
      },
      pluginInfo: {
        fields: [
          "w",
          "h",
          "prompt",
          "negative_prompt",
          "version",
          "sampler",
          "num_steps",
          "guidance_scale",
        ],
      },
    },
  },
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
];
