import { observer } from "mobx-react-lite";

import type { IPythonPlugin } from "@/schema/_python";
import { drawboardPluginFactory } from "@/plugins/utils/factory";
import Render from "@/plugins/components/Render";
import { useTextTransfer } from "./hooks";
import CFMarkdown from "@/components/CFMarkdown";

const PythonMarkdownPlugin = ({ pluginInfo, ...props }: IPythonPlugin) => {
  const { id, text } = useTextTransfer({ key: "markdown", plugin: { pluginInfo, ...props } });

  return (
    <Render id={id} {...props}>
      <CFMarkdown markdown={text} />
    </Render>
  );
};

drawboardPluginFactory.registerPython("_python.markdown", true)(observer(PythonMarkdownPlugin));
