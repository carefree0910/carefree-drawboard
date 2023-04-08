import { observer } from "mobx-react-lite";

import type { ITaskPlugin } from "@/types/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import TaskPlugin from "./components/TaskPlugin";

const Txt2ImgSDPlugin = observer((props: ITaskPlugin) => {
  return <TaskPlugin task="txt2img.sd" {...props} />;
});
drawboardPluginFactory.register("txt2img.sd")(Txt2ImgSDPlugin);
