import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import { langStore, selectingNodesStore, translate } from "@carefree0910/business";
import {
  BasicEditor,
  CFDivider,
  CFHeading,
  TextAlignEditor,
  TextColorEditor,
  TextContentEditor,
  TextFontSizeEditor,
} from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const TextEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("textEditor").id;
  const lang = langStore.tgt;

  const textParams = selectingNodesStore.info.textParams;
  if (node?.type !== "text" || !textParams) {
    props.renderInfo.isInvisible = true;
  }

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["text-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <Flex direction="column" w="100%" h="100%">
        <Flex w="100%">
          <TextFontSizeEditor flex={1} mr="12px" />
          <TextColorEditor />
        </Flex>
        <CFDivider />
        <TextAlignEditor />
        <CFDivider />
        <TextContentEditor flex={1} />
      </Flex>
    </Render>
  );
};
drawboardPluginFactory.register("textEditor", true)(observer(TextEditorPlugin));
