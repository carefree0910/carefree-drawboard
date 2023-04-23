import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";
import { onArrange } from "@/actions/arrange";

const ArrangePlugin = ({ pluginInfo: { nodes }, ...props }: IPlugin) => {
  const id = useMemo(() => `arrange_${getRandomHash()}`, []);
  const t = useToast();
  const lang = langStore.tgt;

  return (
    <Render
      id={id}
      onFloatingButtonClick={async () => onArrange(t, lang, { type: "multiple", nodes })}
      {...props}
    />
  );
};
drawboardPluginFactory.register("arrange", true)(observer(ArrangePlugin));
