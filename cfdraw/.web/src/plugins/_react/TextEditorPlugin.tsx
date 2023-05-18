import type { ColorChangeHandler } from "react-color";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex, Textarea } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, selectingNodesStore, translate, useEditText } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import CFSlider from "@/components/CFSlider";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFColorPicker from "@/components/CFColorPicker";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const TextEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = useMemo(() => `textEditor_${getRandomHash()}`, []);
  const lang = langStore.tgt;
  const [content, setContent] = useState("");
  const [fontSize, setFontSize] = useState(0);

  const textParams = selectingNodesStore.info.textParams;
  const { editColor, editContent, editFontSize } = useEditText();
  useEffect(() => {
    if (node?.type === "text") {
      setContent(node.params.content);
      setFontSize(node.params.fontSize);
    }
  }, [node]);

  const onChange: ColorChangeHandler = (color) => {
    editColor({ trace: false })(color.hex);
  };
  const onChangeComplete: ColorChangeHandler = (color) => {
    console.log(">>> onChangeComplete");
    editColor({ trace: true })(color.hex);
  };

  if (node?.type !== "text" || !textParams) return null;

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["text-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      <Flex direction="column" w="100%" h="100%">
        <Flex w="100%">
          <CFSlider
            flex={1}
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
          <CFColorPicker
            color={textParams.color}
            onChange={onChange}
            onChangeComplete={onChangeComplete}
            disableAlpha
            thumbnailProps={{ ml: "12px" }}
          />
        </Flex>
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
drawboardPluginFactory.register("textEditor", true)(observer(TextEditorPlugin));
