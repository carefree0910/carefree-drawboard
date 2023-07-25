import { observer } from "mobx-react-lite";

import { langStore, translate } from "@carefree0910/business";
import { BasicEditor } from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { drawboardPluginFactory } from "../utils/factory";
import FiltersEditor from "./components/FiltersEditor";
import Render from "../components/Render";

const SVGEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("svgEditor").id;
  const lang = langStore.tgt;
  const field = "$SVGEditor$";

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["svg-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <FiltersEditor node={node} field={field} />
    </Render>
  );
};
drawboardPluginFactory.register("svgEditor", true)(observer(SVGEditorPlugin));
