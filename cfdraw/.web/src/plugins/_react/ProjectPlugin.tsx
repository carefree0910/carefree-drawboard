import Upload from "rc-upload";
import { observer } from "mobx-react-lite";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Box, Flex, Image } from "@chakra-ui/react";

import { Dictionary, Graph, INodePack, getRandomHash } from "@carefree0910/core";
import { langStore, translate, useSafeExecute } from "@carefree0910/business";

import type { IPlugin } from "@/schema/plugins";
import DeleteIcon from "@/assets/icons/delete.svg";
import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Projects_Words } from "@/lang/projects";
import { userStore } from "@/stores/user";
import {
  IProjectsStore,
  getNewProjectInfo,
  getTimeString,
  setCurrentProjectName,
  updateCurrentProjectInfo,
  useCurrentProjectInfo,
} from "@/stores/projects";
import {
  AUTO_SAVE_PREFIX,
  IProject,
  deleteProject,
  getAllProjectInfo,
  getProject,
  loadProject,
  saveCurrentProject,
  saveProject,
} from "@/actions/manageProjects";
import { downloadCurrentFullProject } from "@/actions/download";
import CFText from "@/components/CFText";
import CFInput from "@/components/CFInput";
import CFButton from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { CFSrollableSelect } from "@/components/CFSelect";
import { drawboardPluginFactory } from "../utils/factory";
import { floatingEvent, floatingRenderEvent } from "../components/Floating";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

type IImportLocal = IProject | INodePack[];

const ProjectPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `project_${getRandomHash()}`, []);
  const lang = langStore.tgt;
  const userId = userStore.userId;
  const { uid, name } = useCurrentProjectInfo();
  const [selectedUid, setSelectedUid] = useState("");
  const [userInputName, setUserInputName] = useState(name);
  const [allUid2Name, setAllUid2Name] = useState<Dictionary<string> | undefined>();
  const allProjectUids = useMemo(() => Object.keys(allUid2Name ?? {}), [allUid2Name]);
  const isSelectingAutoSave = useMemo(
    () => selectedUid.startsWith(AUTO_SAVE_PREFIX),
    [selectedUid],
  );
  const getLoadUid = useCallback(() => {
    if (!isSelectingAutoSave) return Promise.resolve(selectedUid);
    // should create a new project when loading auto save project
    return getProject(selectedUid).then((autoSaveProject) => {
      const newProject = getNewProjectInfo();
      newProject.name = `From Auto Save ${getTimeString(Date.now())}`;
      return saveProject(
        { userId, ...autoSaveProject, ...newProject },
        async () => void 0,
        true,
      ).then(() => {
        updateCurrentProjectInfo(newProject);
        updateProjectStates(newProject);
        return newProject.uid;
      });
    });
  }, [userId, selectedUid]);

  const updateUids = useCallback(() => {
    getAllProjectInfo().then((projects) => {
      projects ??= [];
      const uid2name = projects.reduce((acc, { uid, name }) => {
        acc[uid] = name;
        return acc;
      }, {} as Dictionary<string>);
      setAllUid2Name(uid2name);
      if (!!uid2name[uid]) {
        setSelectedUid(uid);
      }
    });
  }, []);

  useEffect(() => {
    const { dispose: floatingDispose } = floatingEvent.on(({ type }) => {
      if (type === "newProject") {
        updateProjectStates(useCurrentProjectInfo());
      }
    });
    const { dispose: floatingRenderDispose } = floatingRenderEvent.on(
      ({ id: incomingId, expand }) => {
        if (id === incomingId && expand) updateUids();
      },
    );

    return () => {
      floatingDispose();
      floatingRenderDispose();
    };
  }, [id]);

  const closePanel = useClosePanel(id);
  function updateProjectStates({ uid, name }: IProjectsStore) {
    setSelectedUid(uid);
    setUserInputName(name);
  }

  function onRenameProject() {
    setCurrentProjectName(userInputName);
    onSaveProject();
    closePanel();
  }
  function onSaveProject() {
    saveCurrentProject(async () => {
      toastWord("success", Toast_Words["save-project-success-message"]);
      updateUids();
      closePanel();
    });
  }
  async function onLoadProjectSuccess(project: IProject) {
    updateProjectStates(project);
    toastWord("success", Toast_Words["load-project-success-message"]);
    closePanel();
  }
  function onLoadProject() {
    if (!selectedUid) {
      toastWord("warning", Toast_Words["please-select-project-message"]);
      return;
    }
    if (selectedUid === uid) {
      toastWord("info", Toast_Words["already-selected-project-message"]);
      return;
    }
    getLoadUid().then((uid) => loadProject(uid, onLoadProjectSuccess));
  }
  function onDownloadProject(): void {
    downloadCurrentFullProject();
    closePanel();
  }
  function onImportLocalProject(data: IImportLocal) {
    toastWord("info", Toast_Words["importing-local-project-message"]);
    if (!Array.isArray(data)) {
      data = data.graphInfo;
    }
    const json = Graph.fromJsonInfo(data as INodePack[])
      .clone()
      .toJson();
    useSafeExecute("addGraph", null, true, {
      success: async () => {
        toastWord("success", Toast_Words["import-local-project-success-message"]);
        closePanel();
      },
      failed: async () => toastWord("error", Toast_Words["import-local-project-error-message"]),
    })({ json });
  }
  function onDeleteProject() {
    if (!selectedUid) {
      toastWord("warning", Toast_Words["please-select-project-to-delete-message"]);
      return;
    }
    if (isSelectingAutoSave) {
      toastWord("warning", Toast_Words["cannot-delete-auto-save-project-message"]);
      return;
    }
    deleteProject(selectedUid).then(() => {
      toastWord("success", Toast_Words["delete-project-success-message"]);
      updateUids();
    });
  }

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        <CFHeading>{translate(Projects_Words["project-plugin-header"], lang)}</CFHeading>
        <CFDivider />
        <CFInput value={userInputName} onChange={(e) => setUserInputName(e.target.value)} />
        <CFButton mt="12px" onClick={onRenameProject}>
          {translate(Projects_Words["save-project"], lang)}
        </CFButton>
        <CFDivider />
        {allUid2Name ? (
          allProjectUids.length > 0 ? (
            <Flex w="100%">
              <CFSrollableSelect
                flex={1}
                value={selectedUid}
                options={allProjectUids}
                onOptionClick={(uid) => setSelectedUid(uid)}
                optionConverter={(uid) => allUid2Name[uid]}
              />
              <Box as="button" w="32px" h="100%" p="4px" mx="4px" onClick={onDeleteProject}>
                <Image src={DeleteIcon} />
              </Box>
            </Flex>
          ) : (
            <CFText>{translate(Projects_Words["no-projects-available"], lang)}</CFText>
          )
        ) : (
          <CFText>{translate(Projects_Words["loading-available-project"], lang)}</CFText>
        )}
        <CFButton mt="12px" onClick={onLoadProject}>
          {translate(Projects_Words["load-project"], lang)}
        </CFButton>
        <CFDivider />
        <CFButton onClick={onDownloadProject}>
          {translate(Projects_Words["download-project"], lang)}
        </CFButton>
        <Upload
          accept=".noli,.cfdraw"
          customRequest={({ file }) => {
            const reader = new FileReader();
            reader.onload = () =>
              onImportLocalProject(JSON.parse(reader.result as string) as IImportLocal);
            reader.readAsText(file as Blob);
          }}>
          <CFButton w="100%" mt="12px">
            {translate(Projects_Words["import-local-project"], lang)}
          </CFButton>
        </Upload>
      </Flex>
    </Render>
  );
};

drawboardPluginFactory.register("project", true)(observer(ProjectPlugin));
