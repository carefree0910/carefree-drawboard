import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";
import {
  BasicEditor,
  CFDivider,
  CFHeading,
  NoliTextFrameAlignEditor,
  NoliTextFrameCommonEditor,
  NoliTextFrameComposeBaseEditor,
  NoliTextFrameContentEditor,
  NoliTextFrameLayersEditor,
} from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const NoliTextFrameEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("noliTextFrameEditor").id;
  const lang = langStore.tgt;

  if (node?.type !== "noliTextFrame") {
    props.renderInfo.isInvisible = true;
  }

  return (
    <Render id={id} {...props}>
      <CFHeading>
        {translate(NodeEditor_Words["noliTextFrame-editor-plugin-header"], lang)}
      </CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <Flex direction="column" w="100%" h="100%">
        <NoliTextFrameComposeBaseEditor />
        <NoliTextFrameAlignEditor mt="8px" />
        <NoliTextFrameCommonEditor mt="8px" />
        <NoliTextFrameContentEditor mt="16px" />
        <NoliTextFrameLayersEditor mt="16px" />
      </Flex>
    </Render>
  );
};
drawboardPluginFactory.register("noliTextFrameEditor", true)(observer(NoliTextFrameEditorPlugin));
