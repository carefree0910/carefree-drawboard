import { observer } from "mobx-react-lite";

import type { ITaskPlugin } from "@/types/plugins";
import { pluginFactory } from "./utils/factory";
import TaskPlugin from "./components/TaskPlugin";

const Txt2ImgSDPlugin = observer((props: ITaskPlugin) => {
  return <TaskPlugin task="txt2img.sd" {...props} />;
});
pluginFactory.register("txt2img.sd")(Txt2ImgSDPlugin);
