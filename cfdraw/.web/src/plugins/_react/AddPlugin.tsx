import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ButtonProps, Flex } from "@chakra-ui/react";

import { Frame, getCenteredBBox, getRandomHash } from "@carefree0910/core";
import { BoardStore, langStore, translate, useSafeExecute } from "@carefree0910/business";
import {
  AddPanel,
  CFDivider,
  CFInput,
  CFIconButton,
  ICFInput,
  toastWord,
} from "@carefree0910/components";

import AddProjectIcon from "@/assets/icons/add-project.svg";
import AddFrameIcon from "@/assets/icons/add-frame.svg";

import type { IPlugin } from "@/schema/plugins";
import { globalEvent } from "@/utils/event";
import { DEFAULT_PLUGIN_SETTINGS } from "@/utils/constants";
import { Add_Words } from "@/lang/add";
import { CFDraw_Toast_Words } from "@/lang/toast";
import { usePluginIds, usePluginIsExpanded } from "@/stores/pluginsInfo";
import { getNewProject, loadLocalProject, saveCurrentProject } from "@/actions/manageProjects";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

const FrameWHInput = ({ onNewFrame, ...props }: ICFInput & { onNewFrame: () => void }) => (
  <CFInput
    w="72px"
    h="36px"
    p="12px"
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        onNewFrame();
      }
    }}
    {...props}
  />
);

const AddPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("add").id;
  const lang = langStore.tgt;
  const expand = usePluginIsExpanded(id);
  const [w, setW] = useState(512);
  const [h, setH] = useState(512);

  const commonProps: ButtonProps = {
    w: `${DEFAULT_PLUGIN_SETTINGS.iconW}px`,
    h: `${DEFAULT_PLUGIN_SETTINGS.iconH}px`,
    p: "8px",
    ml: "8px",
    flexShrink: 0,
  };
  const closePanel = useClosePanel(id);
  const onNewProject = () => {
    toastWord("info", CFDraw_Toast_Words["adding-project-message"]);
    saveCurrentProject(
      async () =>
        loadLocalProject(
          getNewProject(),
          async () => {
            globalEvent.emit({ type: "newProject", data: undefined });
            toastWord("success", CFDraw_Toast_Words["add-project-success-message"]);
            closePanel();
          },
          true,
        ),
      { noToast: true },
    );
  };
  const onNewFrame = () => {
    const newAlias = `add.frame.${getRandomHash()}`;
    const newFrame = new Frame(newAlias, []);
    newFrame.params.properties.bboxFields = getCenteredBBox(w, h, BoardStore.board).fields;
    useSafeExecute(
      "addJson",
      null,
      true,
      {
        success: async () => toastWord("success", CFDraw_Toast_Words["add-frame-success-message"]),
        failed: async () => toastWord("error", CFDraw_Toast_Words["add-frame-error-message"]),
      },
      {
        noSelect: true,
        safeOpt: {
          retry: 3,
          retryInterval: 500,
        },
      },
    )({ alias: newAlias, json: newFrame.toJson() });
  };

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        <Flex w="100%" flex={1} wrap="wrap" align="center" pointerEvents={expand ? "auto" : "none"}>
          <AddPanel />
          <CFDivider />
          <CFIconButton
            src={AddProjectIcon}
            tooltip={translate(Add_Words["new-project-button"], lang)}
            id={`${id}_project`}
            onClick={onNewProject}
            {...commonProps}
          />
          <CFIconButton
            src={AddFrameIcon}
            tooltip={translate(Add_Words["add-frame-button"], lang)}
            id={`${id}_frame`}
            onClick={onNewFrame}
            {...commonProps}
          />
          <FrameWHInput
            ml="4px"
            tooltip={lang === "zh" ? "画框宽度" : "Frame Width"}
            onNewFrame={onNewFrame}
            useNumberInputProps={{ defaultValue: w, onChange: (value) => setW(+value) }}
          />
          <FrameWHInput
            ml="10px"
            tooltip={lang === "zh" ? "画框高度" : "Frame Height"}
            onNewFrame={onNewFrame}
            useNumberInputProps={{ defaultValue: h, onChange: (value) => setH(+value) }}
          />
        </Flex>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("add", true)(observer(AddPlugin));
