import { observer } from "mobx-react-lite";

import type { IFieldsPlugin } from "@/types/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import TaskPlugin from "./components/TaskPlugin";

const Txt2ImgSDPlugin = ({ pluginInfo, ...props }: IFieldsPlugin) => {
  return <TaskPlugin pluginInfo={{ task: "txt2img.sd", ...pluginInfo }} {...props} />;
};
drawboardPluginFactory.register("txt2img.sd")(observer(Txt2ImgSDPlugin));
