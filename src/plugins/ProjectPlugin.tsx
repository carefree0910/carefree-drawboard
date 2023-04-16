import Upload from "rc-upload";
import { observer } from "mobx-react-lite";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Flex, useToast } from "@chakra-ui/react";

import { Dictionary, Graph, INodePack, getRandomHash } from "@noli/core";
import { langStore, translate, useSafeExecute } from "@noli/business";

import type { IPlugin } from "@/schema/plugins";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Projects_Words } from "@/lang/projects";
import { setCurrentProjectName, useCurrentProject } from "@/stores/projects";
import {
  ILoadedProject,
  fetchAllProjects,
  loadProject,
  saveProject,
} from "@/actions/manageProjects";
import CFText from "@/components/CFText";
import CFInput from "@/components/CFInput";
import CFButton from "@/components/CFButton";
import CFDivider from "@/components/CFDivider";
import CFHeading from "@/components/CFHeading";
import { CFSrollableSelect } from "@/components/CFSelect";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";
import { floatingControlEvent, floatingEvent, floatingRenderEvent } from "./components/Floating";
import { downloadCurrentFullProject } from "@/actions/download";

type IImportLocal = ILoadedProject | INodePack[];
const ProjectPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const id = useMemo(() => `project_${getRandomHash()}`, []);
  const t = useToast();
  const lang = langStore.tgt;
  const { uid, name } = useCurrentProject();
  const [selectedUid, setSelectedUid] = useState("");
  const [userInputName, setUserInputName] = useState(name);
  const [allProjects, setAllProjects] = useState<Dictionary<string> | undefined>();
  const allProjectUids = useMemo(() => Object.keys(allProjects ?? {}), [allProjects]);

  const updateUids = useCallback(() => {
    fetchAllProjects().then((projects) => {
      projects ??= [];
      const uid2name = projects.reduce((acc, { uid, name }) => {
        acc[uid] = name;
        return acc;
      }, {} as Dictionary<string>);
      setAllProjects(uid2name);
      if (!!uid2name[uid]) {
        setSelectedUid(uid);
      }
    });
  }, []);

  useEffect(() => {
    const { dispose: floatingDispose } = floatingEvent.on(({ type }) => {
      if (type === "newProject") {
        const { uid, name } = useCurrentProject();
        updateProjectStates(uid, name);
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

  const closePanel = () => floatingControlEvent.emit({ id, expand: false });
  function updateProjectStates(uid: string, name: string) {
    setSelectedUid(uid);
    setUserInputName(name);
  }

  function onRenameProject() {
    setCurrentProjectName(userInputName);
    onSaveProject();
    closePanel();
  }
  function onSaveProject() {
    saveProject(t, lang, async () => {
      toast(t, "success", translate(Toast_Words["save-project-success-message"], lang));
      updateUids();
      closePanel();
    });
  }
  async function onLoadProjectSuccess(res: ILoadedProject) {
    updateProjectStates(res.uid, res.name);
    toast(t, "success", translate(Toast_Words["load-project-success-message"], lang));
    closePanel();
  }
  function onLoadProject() {
    if (!selectedUid) {
      toast(t, "warning", translate(Toast_Words["please-select-project-message"], lang));
      return;
    }
    loadProject(t, lang, selectedUid, onLoadProjectSuccess);
  }
  function onDownloadProject(): void {
    downloadCurrentFullProject(t, lang);
    closePanel();
  }
  function onImportLocalProject(res: IImportLocal) {
    toast(t, "info", translate(Toast_Words["importing-local-project-message"], lang));
    if ((res as ILoadedProject).uid) {
      res = (res as ILoadedProject).graphInfo;
    }
    const json = Graph.fromJsonInfo(res as INodePack[])
      .clone()
      .toJson();
    useSafeExecute("addGraph", null, true, {
      success: async () => {
        toast(t, "success", translate(Toast_Words["import-local-project-success-message"], lang));
        closePanel();
      },
      failed: async () =>
        toast(t, "error", translate(Toast_Words["import-local-project-error-message"], lang)),
    })({ json });
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
        {allProjects ? (
          allProjectUids.length > 0 ? (
            <CFSrollableSelect
              value={selectedUid}
              options={allProjectUids}
              onOptionClick={(uid) => setSelectedUid(uid)}
              optionConverter={(uid) => allProjects[uid]}
            />
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

const _ = observer(ProjectPlugin);
drawboardPluginFactory.register("project")(_);
export default _;
