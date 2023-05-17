import type { IPlugin } from "@/schema/plugins";
import Render from "./Render";

interface ILink {
  url?: string;
  href?: string;
}
export const Link = ({ url, href, pluginInfo, ...props }: ILink & IPlugin) => {
  props.noExpand = true;
  if (href ?? url) {
    return <Render as="a" href={href ?? url} target="_blank" {...props} />;
  }
  return <Render {...props} pointerEvents="none" />;
};
