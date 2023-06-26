import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import { Lang, TextAlign, allTextAlign } from "@carefree0910/core";
import { langStore, selectingNodesStore, translate, useEditText } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { UI_Words } from "@/lang/ui";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { CFSrollableSelect, ICFSelect } from "@/components/CFSelect";
import CFSlider from "@/components/CFSlider";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFTextarea from "@/components/CFTextarea";
import CFColorPicker from "@/components/CFColorPicker";
import { drawboardPluginFactory } from "../utils/factory";
import BasicEditor from "./components/BasicEditor";
import Render from "../components/Render";

const ImageEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("imageEditor").id;
  const lang = langStore.tgt;

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["image-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
    </Render>
  );
};
drawboardPluginFactory.register("imageEditor", true)(observer(ImageEditorPlugin));
