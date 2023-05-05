import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { ButtonProps, Flex } from "@chakra-ui/react";

import { getRandomHash } from "@carefree0910/core";
import { langStore, translate } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import { toastWord } from "@/utils/toast";
import { globalEvent } from "@/utils/event";
import {
  ADD_BLANK_ICON,
  ADD_IMAGE_ICON,
  ADD_PROJECT_ICON,
  ADD_TEXT_ICON,
  DEFAULT_PLUGIN_SETTINGS,
} from "@/utils/constants";
import { Add_Words } from "@/lang/add";
import { Toast_Words } from "@/lang/toast";
import { importMeta } from "@/actions/importMeta";
import { getNewProject, loadLocalProject, saveCurrentProject } from "@/actions/manageProjects";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFImageUploader from "@/components/CFImageUploader";
import { CFIconButton } from "@/components/CFButton";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

const AddPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `add_${getRandomHash()}`, []);
  const lang = langStore.tgt;

  const commonProps: ButtonProps = {
    w: `${DEFAULT_PLUGIN_SETTINGS.iconW}px`,
    h: `${DEFAULT_PLUGIN_SETTINGS.iconH}px`,
    p: "8px",
    ml: "8px",
    flexShrink: 0,
  };
  const closePanel = useClosePanel(id);
  const onNewProject = () => {
    toastWord("info", Toast_Words["adding-project-message"]);
    saveCurrentProject(
      async () =>
        loadLocalProject(
          getNewProject(),
          async () => {
            globalEvent.emit({ type: "newProject", data: undefined });
            toastWord("success", Toast_Words["add-project-success-message"]);
            closePanel();
          },
          true,
        ),
      true,
    );
  };

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        <CFHeading>{translate(Add_Words["add-plugin-header"], lang)}</CFHeading>
        <CFDivider />
        <Flex w="100%" flex={1} wrap="wrap">
          <CFIconButton
            src={ADD_TEXT_ICON}
            tooltip={translate(Add_Words["add-text-button"], lang)}
            id={`${id}_text`}
            onClick={() => {
              importMeta({ lang, type: "add.text", metaData: {} });
              closePanel();
            }}
            {...commonProps}
          />
          <CFImageUploader onUpload={closePanel}>
            <CFIconButton
              src={ADD_IMAGE_ICON}
              tooltip={translate(Add_Words["upload-image-button"], lang)}
              id={`${id}_image`}
              {...commonProps}
            />
          </CFImageUploader>
          <CFIconButton
            src={ADD_BLANK_ICON}
            tooltip={translate(Add_Words["add-blank-button"], lang)}
            id={`${id}_blank`}
            onClick={() => {
              importMeta({ lang, type: "add.blank", metaData: {} });
              closePanel();
            }}
            {...commonProps}
          />
          <CFIconButton
            src={ADD_PROJECT_ICON}
            tooltip={translate(Add_Words["new-project-button"], lang)}
            id={`${id}_project`}
            onClick={onNewProject}
            {...commonProps}
          />
        </Flex>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("add", true)(observer(AddPlugin));
