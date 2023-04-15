import { observer } from "mobx-react-lite";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import { Link } from "./components/Link";

const WikiPlugin = (props: IPlugin) => {
  return <Link url="https://github.com/carefree0910/carefree-drawboard/wiki" {...props} />;
};
const EmailPlugin = (props: IPlugin) => {
  return <Link href="mailto: syameimaru.saki@gmail.com" {...props} />;
};
const GitHubPlugin = (props: IPlugin) => {
  return <Link url="https://github.com/carefree0910/carefree-drawboard" {...props} />;
};
drawboardPluginFactory.register("wiki")(observer(WikiPlugin));
drawboardPluginFactory.register("email")(observer(EmailPlugin));
drawboardPluginFactory.register("github")(observer(GitHubPlugin));
