import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ButtonProps, Flex, Image, Popover, PopoverArrow, PopoverTrigger } from "@chakra-ui/react";

import { Frame, getCenteredBBox, getRandomHash } from "@carefree0910/core";
import {
  BoardStore,
  langStore,
  translate,
  useAddNode,
  useAddPresetNoliFrames,
  useSafeExecute,
} from "@carefree0910/business";

import AddTextIcon from "@/assets/icons/add-text.svg";
import AddNoliFrameIcon from "@/assets/icons/add-noliFrame.svg";
import AddNoliTextFrameIcon from "@/assets/icons/add-noliTextFrame.svg";
import AddImageIcon from "@/assets/icons/add-image.svg";
import AddBlankIcon from "@/assets/icons/add-blank.svg";
import AddProjectIcon from "@/assets/icons/add-project.svg";
import AddFrameIcon from "@/assets/icons/add-frame.svg";

import type { IPlugin } from "@/schema/plugins";
import { toastWord } from "@/utils/toast";
import { globalEvent } from "@/utils/event";
import { DEFAULT_FIELD_H, DEFAULT_PLUGIN_SETTINGS } from "@/utils/constants";
import { Add_Words } from "@/lang/add";
import { Toast_Words } from "@/lang/toast";
import { themeStore, useScrollBarSx } from "@/stores/theme";
import { usePluginIds, usePluginIsExpanded } from "@/stores/pluginsInfo";
import { importMeta } from "@/actions/importMeta";
import { getNewProject, loadLocalProject, saveCurrentProject } from "@/actions/manageProjects";
import CFInput, { ICFInput } from "@/components/CFInput";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import CFImageUploader from "@/components/CFImageUploader";
import CFPopoverContent from "@/components/CFPopoverContent";
import { CFCaption } from "@/components/CFText";
import { CFIconButton } from "@/components/CFButton";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

interface IPresetNoliFramePanel {
  closePanel: () => void;
}
const PresetNoliFramePanel = observer(({ closePanel }: IPresetNoliFramePanel) => {
  const w = "360px";
  const addPresetFramesRes = useAddPresetNoliFrames();

  if (!addPresetFramesRes.ready) {
    return (
      <Flex w={w} h={DEFAULT_FIELD_H} align="center">
        <CFCaption w="100%" align="center">
          Loading...
        </CFCaption>
      </Flex>
    );
  }

  return (
    <Flex
      w={w}
      p="16px"
      gap="8px"
      wrap="wrap"
      align="center"
      justify="space-evenly"
      sx={useScrollBarSx()}>
      {addPresetFramesRes.data.button.map(({ id, preview, add }) => (
        <Image
          key={id}
          src={preview}
          onClick={() => {
            add({ trace: true })();
            closePanel();
          }}
          width={100}
        />
      ))}
    </Flex>
  );
});

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
  const { addTextFrame } = useAddNode();
  const { textColor } = themeStore.styles;

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
  const onNewFrame = () => {
    const newAlias = `add.frame.${getRandomHash()}`;
    const newFrame = new Frame(newAlias, []);
    newFrame.params.properties.bboxFields = getCenteredBBox(w, h, BoardStore.board).fields;
    useSafeExecute(
      "addJson",
      null,
      true,
      {
        success: async () => toastWord("success", Toast_Words["add-frame-success-message"]),
        failed: async () => toastWord("error", Toast_Words["add-frame-error-message"]),
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
        <CFHeading>{translate(Add_Words["add-plugin-header"], lang)}</CFHeading>
        <CFDivider />
        <Flex w="100%" flex={1} wrap="wrap" align="center" pointerEvents={expand ? "auto" : "none"}>
          <CFIconButton
            src={AddTextIcon}
            tooltip={translate(Add_Words["add-text-button"], lang)}
            id={`${id}_text`}
            onClick={() => {
              importMeta({ lang, type: "add.text", metaData: {} });
              closePanel();
            }}
            {...commonProps}
          />
          <Popover>
            <PopoverTrigger>
              <CFIconButton
                src={AddNoliFrameIcon}
                tooltip={translate(Add_Words["add-noliFrame-button"], lang)}
                id={`${id}_noliFrame`}
                {...commonProps}
              />
            </PopoverTrigger>
            <CFPopoverContent w="100%" h="100%" maxH="360px" usePortal>
              <PopoverArrow />
              <PresetNoliFramePanel closePanel={closePanel} />
            </CFPopoverContent>
          </Popover>
          <CFIconButton
            src={AddNoliTextFrameIcon}
            tooltip={translate(Add_Words["add-noliTextFrame-button"], lang)}
            id={`${id}_noliTextFrame`}
            onClick={() => {
              addTextFrame({ trace: true })({ lang, initColor: textColor });
              closePanel();
            }}
            {...commonProps}
          />
          <CFImageUploader onUpload={closePanel}>
            <CFIconButton
              src={AddImageIcon}
              tooltip={translate(Add_Words["upload-image-button"], lang)}
              id={`${id}_image`}
              {...commonProps}
            />
          </CFImageUploader>
          <CFIconButton
            src={AddBlankIcon}
            tooltip={translate(Add_Words["add-blank-button"], lang)}
            id={`${id}_blank`}
            onClick={() => {
              importMeta({ lang, type: "add.blank", metaData: {} });
              closePanel();
            }}
            {...commonProps}
          />
          <CFIconButton
            src={AddProjectIcon}
            tooltip={translate(Add_Words["new-project-button"], lang)}
            id={`${id}_project`}
            onClick={onNewProject}
            {...commonProps}
          />
          <CFDivider />
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
