import { observer } from "mobx-react-lite";

import { langStore, translate } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "../utils/factory";
import BasicEditor from "./components/BasicEditor";
import FiltersEditor from "./components/FiltersEditor";
import Render from "../components/Render";

const ImageEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("imageEditor").id;
  const lang = langStore.tgt;
  const field = "$ImageEditor$";

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["image-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <FiltersEditor node={node} field={field} />
    </Render>
  );
};
drawboardPluginFactory.register("imageEditor", true)(observer(ImageEditorPlugin));
