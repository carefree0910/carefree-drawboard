import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import { langStore, selectingNodesStore, translate, useEditNode } from "@carefree0910/business";
import { BasicEditor } from "@carefree0910/components";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFTextarea from "@/components/CFTextarea";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const NoliFrameEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("noliFrameEditor").id;
  const lang = langStore.tgt;

  const apiInfo = selectingNodesStore.info.noliFrameAPIInfo;
  if (node?.type !== "noliFrame" || !apiInfo) {
    props.renderInfo.isInvisible = true;
  }

  const [content, setContent] = useState("");
  useEffect(() => {
    if (content !== apiInfo?.content) setContent(apiInfo?.content ?? "");
  }, [apiInfo]);

  const { editNoliFrame } = useEditNode({ allowUsePreviousNode: true });

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["noliFrame-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <BasicEditor />
      <CFDivider />
      <Flex direction="column" w="100%" h="100%">
        <CFTextarea
          flex={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => editNoliFrame({ trace: true })({ content })}
        />
      </Flex>
    </Render>
  );
};
drawboardPluginFactory.register("noliFrameEditor", true)(observer(NoliFrameEditorPlugin));
