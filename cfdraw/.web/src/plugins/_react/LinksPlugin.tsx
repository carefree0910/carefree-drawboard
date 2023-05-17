import { useMemo } from "react";
import { observer } from "mobx-react-lite";

import { getRandomHash } from "@carefree0910/core";

import type { ILogoPlugin, IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "../utils/factory";
import { Link } from "../components/Link";

const WikiPlugin = (props: IPlugin) => {
  const id = useMemo(() => `wikiLink_${getRandomHash()}`, []);
  return <Link id={id} url="https://github.com/carefree0910/carefree-drawboard/wiki" {...props} />;
};
const EmailPlugin = (props: IPlugin) => {
  const id = useMemo(() => `emailLink_${getRandomHash()}`, []);
  return <Link id={id} href="mailto: syameimaru.saki@gmail.com" {...props} />;
};
const GitHubPlugin = (props: IPlugin) => {
  const id = useMemo(() => `githubLink_${getRandomHash()}`, []);
  return <Link id={id} url="https://github.com/carefree0910/carefree-drawboard" {...props} />;
};
const LogoPlugin = (props: ILogoPlugin) => {
  const id = useMemo(() => `logo_${getRandomHash()}`, []);
  return <Link id={id} url={props.pluginInfo.redirectUrl} {...props} />;
};

drawboardPluginFactory.register("wiki", true)(observer(WikiPlugin));
drawboardPluginFactory.register("email", true)(observer(EmailPlugin));
drawboardPluginFactory.register("github", true)(observer(GitHubPlugin));
drawboardPluginFactory.register("logo", true)(observer(LogoPlugin));
