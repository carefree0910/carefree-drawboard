import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { useSelecting } from "@noli/business";

import Render, { IRender } from "./utils/Render";

const MetaPlugin = observer((props: IRender) => {
  const info = useSelecting("raw");
  if (!info || info.type === "group" || info.type === "multiple") return null;
  const meta = info.displayNode?.params.meta;
  if (!meta) return null;

  return (
    <Render {...props}>
      <Textarea w="100%" h="100%" value={JSON.stringify(meta, null, 2)} readOnly />
    </Render>
  );
});

export function makeMetaPlugin(props: Omit<IRender, "follow">) {
  return <MetaPlugin follow {...props} />;
}
