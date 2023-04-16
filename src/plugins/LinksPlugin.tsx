import { observer } from "mobx-react-lite";

import { getRandomHash } from "@noli/core";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import { Link } from "./components/Link";

const WikiPlugin = (props: IPlugin) => {
  const id = `wikiLink_${getRandomHash()}`;
  return <Link id={id} url="https://github.com/carefree0910/carefree-drawboard/wiki" {...props} />;
};
const EmailPlugin = (props: IPlugin) => {
  const id = `emailLink_${getRandomHash()}`;
  return <Link id={id} href="mailto: syameimaru.saki@gmail.com" {...props} />;
};
const GitHubPlugin = (props: IPlugin) => {
  const id = `githubLink_${getRandomHash()}`;
  return <Link id={id} url="https://github.com/carefree0910/carefree-drawboard" {...props} />;
};
drawboardPluginFactory.register("wiki")(observer(WikiPlugin));
drawboardPluginFactory.register("email")(observer(EmailPlugin));
drawboardPluginFactory.register("github")(observer(GitHubPlugin));
