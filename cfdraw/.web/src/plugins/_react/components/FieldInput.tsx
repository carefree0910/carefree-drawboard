import { useUnmount } from "ahooks";
import { ReactElement, useEffect, useState } from "react";
import { Center, Flex } from "@chakra-ui/react";

import CFInput, { ICFInput } from "@/components/CFInput";
import { CFCaption } from "@/components/CFText";

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
  const safeSetValue = () => {
    if (iv !== value) {
      setValue(iv);
    }
  };

  useEffect(() => setIv(value), [value]);
  useUnmount(safeSetValue);

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
          onBlur: safeSetValue,
        }}
        {...props}
      />
    </Flex>
  );
};

export default FieldInput;
