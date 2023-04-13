import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex, Textarea } from "@chakra-ui/react";

import { isUndefined } from "@noli/core";
import { langStore, translate, useEditText } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import Render from "./components/Render";
import { drawboardPluginFactory } from "./utils/factory";
import CFSlider from "@/components/CFSlider";
import { CFHeading } from "@/components/CFHeading";
import { CFDivider } from "@/components/CFDivider";
import { NodeEditor_Words } from "@/lang/nodeEditor";

const EditTextPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const lang = langStore.tgt;
  const { nodeContent, nodeFontSize } = useMemo<{
    nodeContent?: string;
    nodeFontSize?: number;
  }>(() => {
    if (!node || node.type !== "text") return {};
    return {
      nodeContent: node.params.content,
      nodeFontSize: node.params.fontSize,
    };
  }, [node]);
  const [content, setContent] = useState(nodeContent ?? "");
  const [fontSize, setFontSize] = useState(nodeFontSize ?? 16);
  const { editContent, editFontSize } = useEditText();

  if (isUndefined(nodeContent)) return null;

  return (
    <Render {...props}>
      <CFHeading>{translate(NodeEditor_Words["text-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <Flex direction="column" w="100%" h="100%">
        <CFSlider
          min={12}
          max={1024}
          precision={0}
          value={fontSize}
          scale="logarithmic"
          onSliderChange={(value) => {
            setFontSize(value);
            editFontSize({ trace: false })(value);
          }}
          onBlur={() => editFontSize({ trace: true })(fontSize)}
        />
        <CFDivider />
        <Textarea
          flex={1}
          value={content}
          onChange={(e) => {
            const value = e.target.value;
            setContent(value);
            editContent({ trace: false })(value);
          }}
          onBlur={() => editContent({ trace: true })(content)}
        />
      </Flex>
    </Render>
  );
};
drawboardPluginFactory.register("textEditor")(observer(EditTextPlugin));
