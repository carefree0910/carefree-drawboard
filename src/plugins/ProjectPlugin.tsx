import { observer } from "mobx-react-lite";
import { Box, Button, Checkbox, Flex, useToast } from "@chakra-ui/react";

import { langStore, translate } from "@noli/business";

import type { IPlugin } from "@/types/plugins";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Projects_Words } from "@/lang/projects";
import { saveProject } from "@/actions/manageProjects";
import { CFButton } from "@/components/CFButton";
import { CFDivider } from "@/components/CFDivider";
import { CFHeading } from "@/components/CFHeading";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";

const ProjectPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const t = useToast();
  const lang = langStore.tgt;

  function onSaveProject() {
    saveProject(t, lang, async () =>
      toast(t, "success", translate(Toast_Words["save-project-success-message"], lang)),
    );
  }

  return (
    <Render {...props}>
      <Flex w="100%" h="100%" direction="column">
        <CFHeading>{translate(Projects_Words["project-header"], lang)}</CFHeading>
        <CFDivider />
        <CFButton onClick={onSaveProject}>
          {translate(Projects_Words["save-project"], lang)}
        </CFButton>
      </Flex>
    </Render>
  );
};

const _ = observer(ProjectPlugin);
drawboardPluginFactory.register("project")(_);
export default _;
