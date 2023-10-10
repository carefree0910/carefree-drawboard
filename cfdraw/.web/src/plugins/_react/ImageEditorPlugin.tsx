import { observer } from "mobx-react-lite";

import { langStore, translate } from "@carefree0910/business";
import {
  BasicEditor,
  CFDivider,
  CFHeading,
  ImageFiltersEditor,
  ImageRenderTypeEditor,
} from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const ImageEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("imageEditor").id;
  const lang = langStore.tgt;
  const field = "$ImageEditor$";

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["image-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <ImageFiltersEditor field={field} />
      <ImageRenderTypeEditor flexProps={{ mt: "16px" }} />
    </Render>
  );
};
drawboardPluginFactory.register("imageEditor", true)(observer(ImageEditorPlugin));
