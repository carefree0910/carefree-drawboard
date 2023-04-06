import { observer } from "mobx-react-lite";
import { Textarea } from "@chakra-ui/react";

import { useSelecting } from "@noli/business";

import type { IRender } from "@/types/plugins";
import Render from "./utils/Render";
import { pluginFactory } from "./utils/factory";

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
pluginFactory.register("meta")(MetaPlugin);