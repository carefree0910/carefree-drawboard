import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";

import { langStore } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";
import { onArrange } from "@/actions/arrange";

const ArrangePlugin = ({ pluginInfo: { nodes }, ...props }: IPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;

  return (
    <Render
      onFloatingButtonClick={async () => onArrange(t, lang, { type: "multiple", nodes })}
      {...props}
    />
  );
};
drawboardPluginFactory.register("arrange")(observer(ArrangePlugin));
