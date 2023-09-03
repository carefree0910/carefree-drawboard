import Upload from "rc-upload";
import { observer } from "mobx-react-lite";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Box, Flex, Image } from "@chakra-ui/react";

import { Dictionary, Graph, INodePack, Logger } from "@carefree0910/core";
import { BoardStore, langStore, translate, useSafeExecute } from "@carefree0910/business";
import {
  CFText,
  CFInput,
  CFButton,
  CFDivider,
  CFHeading,
  CFSrollableSelect,
  toastWord,
} from "@carefree0910/components";

import DeleteIcon from "@/assets/icons/delete.svg";

import type { IPlugin } from "@/schema/plugins";
import { globalEvent } from "@/utils/event";
import { CFDraw_Toast_Words } from "@/lang/toast";
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
import { usePluginIds, usePluginIsExpanded } from "@/stores/pluginsInfo";
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
import { cleanGraph } from "@/actions/graphOps";
import { downloadCurrentFullProject } from "@/actions/download";
import { drawboardPluginFactory } from "../utils/factory";
import { useClosePanel } from "../components/hooks";
import Render from "../components/Render";

type IImportLocal = IProject | INodePack[];

const ProjectPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = usePluginIds("project").id;
  const lang = langStore.tgt;
  const userId = userStore.userId;
  const expand = usePluginIsExpanded(id);
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
  }, [userId, selectedUid, isSelectingAutoSave]);

  const updateUids = useCallback(() => {
    getAllProjectInfo()
      .then((projects) => {
        projects ??= [];
        const uid2name = projects.reduce((acc, { uid, name }) => {
          acc[uid] = name;
          return acc;
        }, {} as Dictionary<string>);
        setAllUid2Name(uid2name);
        if (!!uid2name[uid]) {
          setSelectedUid(uid);
        }
      })
      .catch((err) => {
        Logger.warn(`[ProjectPlugin] updateUids failed: ${err}, retrying...`);
        setTimeout(updateUids, 1000);
      });
  }, [uid]);

  useEffect(() => {
    const { dispose } = globalEvent.on(({ type }) => {
      if (type === "newProject") {
        updateProjectStates(useCurrentProjectInfo());
      }
    });
    return dispose;
  }, []);

  useEffect(() => {
    if (expand) {
      updateUids();
    }
  }, [expand]);

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
      toastWord("success", CFDraw_Toast_Words["save-project-success-message"]);
      updateUids();
      closePanel();
    });
  }
  async function onLoadProjectSuccess(project: IProject) {
    updateProjectStates(project);
    toastWord("success", CFDraw_Toast_Words["load-project-success-message"]);
    closePanel();
  }
  function onLoadProject() {
    if (!selectedUid) {
      toastWord("warning", CFDraw_Toast_Words["please-select-project-message"]);
      return;
    }
    if (selectedUid === uid) {
      toastWord("info", CFDraw_Toast_Words["already-selected-project-message"]);
      return;
    }
    getLoadUid()
      .then(async (uid) => {
        await BoardStore.board.selectorPluginNullable?.destroyAll();
        return uid;
      })
      .then((uid) => loadProject(uid, onLoadProjectSuccess))
      .catch((err) =>
        toastWord("error", CFDraw_Toast_Words["load-project-error-message"], {
          appendix: ` - ${err}`,
        }),
      );
  }
  function onDownloadProject(): void {
    downloadCurrentFullProject();
    closePanel();
  }
  function onImportLocalProject(data: IImportLocal) {
    toastWord("info", CFDraw_Toast_Words["importing-local-project-message"]);
    if (!Array.isArray(data)) {
      data = data.graphInfo;
    }
    const json = cleanGraph(Graph.fromJsonInfo(data as INodePack[]).clone()).toJson();
    useSafeExecute("addGraph", null, true, {
      success: async () => {
        toastWord("success", CFDraw_Toast_Words["import-local-project-success-message"]);
        closePanel();
      },
      failed: async () =>
        toastWord("error", CFDraw_Toast_Words["import-local-project-error-message"]),
    })({ json });
  }
  function onDeleteProject() {
    if (!selectedUid) {
      toastWord("warning", CFDraw_Toast_Words["please-select-project-to-delete-message"]);
      return;
    }
    if (isSelectingAutoSave) {
      toastWord("warning", CFDraw_Toast_Words["cannot-delete-auto-save-project-message"]);
      return;
    }
    deleteProject(selectedUid)
      .then(() => {
        toastWord("success", CFDraw_Toast_Words["delete-project-success-message"]);
        updateUids();
      })
      .catch((err) =>
        toastWord("error", CFDraw_Toast_Words["delete-project-error-message"], {
          appendix: ` - ${err}`,
        }),
      );
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
              <CFSrollableSelect<string, false>
                boxProps={{ flex: 1 }}
                value={{ value: selectedUid, label: allUid2Name?.[selectedUid] }}
                options={allProjectUids.map((uid) => ({ value: uid, label: allUid2Name[uid] }))}
                onChange={(e) => {
                  if (!!e) {
                    setSelectedUid(e.value);
                  }
                }}
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
