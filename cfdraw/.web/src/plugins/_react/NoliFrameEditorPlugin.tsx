import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import { langStore, translate } from "@carefree0910/business";
import {
  BasicEditor,
  CFDivider,
  CFHeading,
  NoliFrameContentEditor,
} from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const NoliFrameEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("noliFrameEditor").id;
  const lang = langStore.tgt;

  if (node?.type !== "noliFrame") {
    props.renderInfo.isInvisible = true;
  }

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["noliFrame-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <Flex direction="column" w="100%" h="100%">
        <NoliFrameContentEditor flex={1} />
      </Flex>
    </Render>
  );
};
drawboardPluginFactory.register("noliFrameEditor", true)(observer(NoliFrameEditorPlugin));
