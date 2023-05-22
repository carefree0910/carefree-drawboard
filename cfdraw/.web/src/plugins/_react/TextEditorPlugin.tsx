import type { ColorChangeHandler } from "react-color";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Flex, Textarea } from "@chakra-ui/react";

import { Lang, TextAlign, allTextAlign, getRandomHash } from "@carefree0910/core";
import { langStore, selectingNodesStore, translate, useEditText } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { UI_Words } from "@/lang/ui";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import { CFSrollableSelect, ICFSelect } from "@/components/CFSelect";
import CFSlider from "@/components/CFSlider";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFColorPicker from "@/components/CFColorPicker";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";

const textAlignDict: Record<TextAlign, Record<Lang, string>> = {
  left: { zh: "左对齐", en: "Left" },
  center: { zh: "居中", en: "Center" },
  right: { zh: "右对齐", en: "Right" },
  justify: { zh: "两端对齐", en: "Justify" },
};

const TextEditorPlugin = ({ pluginInfo: { node }, ...props }: IPlugin) => {
  const id = usePluginIds("textEditor").id;
  const lang = langStore.tgt;
  const [content, setContent] = useState("");
  const [fontSize, setFontSize] = useState(0);

  const textParams = selectingNodesStore.info.textParams;
  const { editColor, editContent, editFontSize, editAlign } = useEditText();
  useEffect(() => {
    if (node?.type === "text") {
      setContent(node.params.content);
      setFontSize(node.params.fontSize);
    }
  }, [node]);

  const onChangeColor: ColorChangeHandler = (color) => {
    editColor({ trace: false })(color.hex);
  };
  const onChangeColorComplete: ColorChangeHandler = (color) => {
    console.log(">>> onChangeComplete");
    editColor({ trace: true })(color.hex);
  };
  const onChangeAlign: ICFSelect<TextAlign, false>["onChange"] = (e) => {
    if (!!e) {
      editAlign({ trace: true })(e.value);
    }
  };

  if (node?.type !== "text" || !textParams) return null;

  const textColor = textParams.color;
  const textAlign = textParams.align ?? "left";

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
            color={textColor}
            onChange={onChangeColor}
            onChangeComplete={onChangeColorComplete}
            thumbnailProps={{ ml: "12px" }}
          />
        </Flex>
        <CFDivider />
        <CFSrollableSelect<TextAlign, false>
          label={translate(UI_Words["text-editor-align-label"], lang)}
          height="36px"
          flexProps={{ h: "36px" }}
          labelProps={{ mx: "6px" }}
          boxProps={{ flex: 1 }}
          value={{
            value: textAlign,
            label: textAlignDict[textAlign][lang],
          }}
          options={allTextAlign.map((align) => ({
            value: align,
            label: textAlignDict[align][lang],
          }))}
          onChange={onChangeAlign}
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
drawboardPluginFactory.register("textEditor", true)(observer(TextEditorPlugin));
