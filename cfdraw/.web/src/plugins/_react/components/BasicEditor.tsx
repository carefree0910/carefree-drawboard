import { observer } from "mobx-react-lite";
import { Flex } from "@chakra-ui/react";

import { mean } from "@carefree0910/core";
import { useCornerRadius, useIsReady, useSelecting } from "@carefree0910/business";

import { ReactComponent as RotateIcon } from "@/assets/icons/rotate.svg";
import { ReactComponent as CornerRadiusIcon } from "@/assets/icons/corner-radius.svg";

import CFIcon from "@/components/CFIcon";
import FieldInput from "./FieldInput";

const BasicEditor = () => {
  const { cornerRadius, setCornerRadius } = useCornerRadius();
  if (!useIsReady()) return null;
  const info = useSelecting("basic")({ fixed: 1 });
  if (!info) return null;
  const {
    type,
    x,
    y,
    w,
    h,
    rotation,
    displayNode,
    setX,
    setY,
    setW,
    setH,
    setRotation,
    selectingNode,
  } = info;
  if (type === "none" || type === "multiple") return null;
  return (
    <Flex w="100%" px="12px" gap="12px" wrap="wrap" justify="flex-start" key={selectingNode.alias}>
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
          value={cornerRadius ? parseFloat(mean(Object.values(cornerRadius)).toFixed(1)) : 0.0}
          setValue={(v) => setCornerRadius({ trace: true })({ lt: v, rt: v, rb: v, lb: v })}
        />
      ) : null}
    </Flex>
  );
};

export default observer(BasicEditor);
