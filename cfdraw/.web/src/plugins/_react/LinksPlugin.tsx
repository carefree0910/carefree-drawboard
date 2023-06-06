import { observer } from "mobx-react-lite";

import type { ILogoPlugin, IPlugin } from "@/schema/plugins";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import { Link } from "../components/Link";

const WikiPlugin = (props: IPlugin) => {
  const id = usePluginIds("wiki").id;
  return <Link id={id} url="https://carefree0910.me/carefree-drawboard-doc/" {...props} />;
};
const EmailPlugin = (props: IPlugin) => {
  const id = usePluginIds("email").id;
  return <Link id={id} href="mailto: syameimaru.saki@gmail.com" {...props} />;
};
const GitHubPlugin = (props: IPlugin) => {
  const id = usePluginIds("github").id;
  return <Link id={id} url="https://github.com/carefree0910/carefree-drawboard" {...props} />;
};
const LogoPlugin = (props: ILogoPlugin) => {
  const id = usePluginIds("logo").id;
  return <Link id={id} url={props.pluginInfo.redirectUrl} {...props} />;
};

drawboardPluginFactory.register("wiki", true)(observer(WikiPlugin));
drawboardPluginFactory.register("email", true)(observer(EmailPlugin));
drawboardPluginFactory.register("github", true)(observer(GitHubPlugin));
drawboardPluginFactory.register("logo", true)(observer(LogoPlugin));
