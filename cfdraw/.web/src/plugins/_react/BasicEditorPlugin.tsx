import { useUnmount } from "ahooks";
import { ReactElement, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Center, Flex } from "@chakra-ui/react";

import {
  langStore,
  translate,
  useCornerRadius,
  useIsReady,
  useSelecting,
} from "@carefree0910/business";

import { ReactComponent as RotateIcon } from "@/assets/icons/rotate.svg";
import { ReactComponent as CornerRadiusIcon } from "@/assets/icons/corner-radius.svg";

import type { IPlugin } from "@/schema/plugins";
import { NodeEditor_Words } from "@/lang/nodeEditor";
import { usePluginIds } from "@/stores/pluginsInfo";
import CFIcon from "@/components/CFIcon";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFInput, { ICFInput } from "@/components/CFInput";
import { CFCaption } from "@/components/CFText";
import { drawboardPluginFactory } from "../utils/factory";
import Render from "../components/Render";
import { mean } from "@carefree0910/core";

const FieldInput = ({
  caption,
  value,
  setValue,
  ...props
}: ICFInput & {
  caption?: string | ReactElement;
  value: number;
  setValue: (value: number) => void;
}) => {
  const [iv, setIv] = useState(value);

  useEffect(() => setIv(value), [value]);
  useUnmount(() => setValue(iv));

  return (
    <Flex align="center">
      <CFCaption w="24px" mr="12px" as="div">
        <Center>{caption}</Center>
      </CFCaption>
      <CFInput
        w="72px"
        h="36px"
        p="12px"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as any)?.blur();
          }
        }}
        useNumberInputProps={{
          value: iv,
          onChange: (value) => setIv(+value),
          onBlur: () => setValue(iv),
        }}
        {...props}
      />
    </Flex>
  );
};

const BasicEditorPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("basicEditor").id;
  const lang = langStore.tgt;
  let x: number, y: number, w: number, h: number, rotation: number;
  let Fields: ReactElement | null = null;
  const { cornerRadius, setCornerRadius } = useCornerRadius();
  if (!useIsReady()) {
    props.renderInfo.isInvisible = true;
  } else {
    const info = useSelecting("basic")({ fixed: 1 });
    if (!info) {
      props.renderInfo.isInvisible = true;
    } else {
      ({ x, y, w, h, rotation } = info);
      const { type, displayNode, setX, setY, setW, setH, setRotation } = info;
      if (type === "none" || type === "multiple") {
        props.renderInfo.isInvisible = true;
      } else {
        Fields = (
          <Flex w="100%" px="12px" gap="12px" wrap="wrap" justify="flex-start">
            <FieldInput caption="X" value={x} setValue={setX({ trace: true })} />
            <FieldInput caption="Y" value={y} setValue={setY({ trace: true })} />
            <FieldInput caption="W" value={w} setValue={setW({ trace: true })} />
            <FieldInput caption="H" value={h} setValue={setH({ trace: true })} />
            <FieldInput
              caption={<CFIcon svg={RotateIcon} fillbyCurrentColor />}
              value={rotation}
              setValue={setRotation({ trace: true })}
            />
            {displayNode.type === "image" ? (
              <FieldInput
                caption={<CFIcon svg={CornerRadiusIcon} fillbyCurrentColor />}
                value={
                  cornerRadius ? parseFloat(mean(Object.values(cornerRadius)).toFixed(1)) : 0.0
                }
                setValue={(v) => setCornerRadius({ trace: true })({ lt: v, rt: v, rb: v, lb: v })}
              />
            ) : null}
          </Flex>
        );
      }
    }
  }

  return (
    <Render id={id} {...props}>
      <CFHeading>{translate(NodeEditor_Words["basic-editor-plugin-header"], lang)}</CFHeading>
      <CFDivider />
      {Fields}
    </Render>
  );
};
drawboardPluginFactory.register("basicEditor", true)(observer(BasicEditorPlugin));
