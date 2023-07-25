import { observer } from "mobx-react-lite";

import { langStore, translate } from "@carefree0910/business";
import { BasicEditor, CFDivider, CFHeading } from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const BasicEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("basicEditor").id;
  const lang = langStore.tgt;

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["basic-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
    </Render>
  );
};
drawboardPluginFactory.register("basicEditor", true)(observer(BasicEditorPlugin));
