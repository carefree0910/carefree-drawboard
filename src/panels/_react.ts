import type { AvailablePlugins, IMakePlugin } from "@/types/plugins";

export const reactPluginSettings: IMakePlugin<AvailablePlugins>[] = [
  {
    type: "txt2img.sd",
    props: {
      nodeConstraint: "none",
      renderInfo: {
        w: 1000,
        h: 600,
        src: "https://ailab-huawei-cdn.nolibox.com/upload/images/ec388e38bdac4f72978b895c2f686cdf.png",
        pivot: "left",
        follow: false,
        useModal: true,
        modalOpacity: 0.9,
      },
      pluginInfo: {
        fields: ["prompt"],
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
];
