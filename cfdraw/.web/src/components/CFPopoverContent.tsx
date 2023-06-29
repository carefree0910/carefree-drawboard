import React from "react";
import { PopoverContent, PopoverContentProps, Portal } from "@chakra-ui/react";

interface ICFPopoverContent extends PopoverContentProps {
  usePortal?: boolean;
}
export default ({ usePortal, ...props }: ICFPopoverContent) => {
  const Wrapper = usePortal ? Portal : React.Fragment;
  return (
    <Wrapper>
      <PopoverContent {...props} />
    </Wrapper>
  );
};
