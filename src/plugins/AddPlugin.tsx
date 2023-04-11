import { observer } from "mobx-react-lite";
import { Flex, useToast } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import type { IPlugin } from "@/types/plugins";
import { Add_Words } from "@/lang/add";
import { CFHeading } from "@/components/CFHeading";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const AddPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;

  return (
    <Render {...props}>
      <Flex w="100%" h="100%" direction="column">
        <CFHeading>{translate(Add_Words["add-plugin-header"], lang)}</CFHeading>
      </Flex>
    </Render>
  );
};

const _ = observer(AddPlugin);
drawboardPluginFactory.register("add")(_);
export default _;
