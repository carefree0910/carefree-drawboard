import { observer } from "mobx-react-lite";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Flex, useToast } from "@chakra-ui/react";

import { Dictionary, getRandomHash } from "@noli/core";
import { langStore, translate } from "@noli/business";

import type { IPlugin } from "@/types/plugins";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Projects_Words } from "@/lang/projects";
import { setCurrentProjectName, updateCurrentProject, useCurrentProject } from "@/stores/projects";
import { fetchAllProjects, loadProject, saveProject } from "@/actions/manageProjects";
import CFSelect from "@/components/CFSelect";
import { CFText } from "@/components/CFText";
import { CFInput } from "@/components/CFInput";
import { CFButton } from "@/components/CFButton";
import { CFDivider } from "@/components/CFDivider";
import { CFHeading } from "@/components/CFHeading";
import { drawboardPluginFactory } from "./utils/factory";
import Render from "./components/Render";
import { floatingEvent } from "./components/Floating";

const ProjectPlugin = ({ pluginInfo, ...props }: IPlugin) => {
  const t = useToast();
  const id = `project_${getRandomHash()}`;
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
    floatingEvent.on(({ id: incomingId, expand }) => {
      if (id === incomingId && expand) updateUids();
    });
  }, [id]);

  function onRenameProject() {
    setCurrentProjectName(userInputName);
    onSaveProject();
  }
  function onSaveProject() {
    saveProject(t, lang, async () => {
      toast(t, "success", translate(Toast_Words["save-project-success-message"], lang));
      updateUids();
    });
  }
  function onLoadProject() {
    if (!selectedUid) {
      toast(t, "warning", translate(Toast_Words["please-select-project-message"], lang));
      return;
    }
    loadProject(t, lang, selectedUid, async (res) => {
      updateCurrentProject(res);
      setUserInputName(res.name);
      toast(t, "success", translate(Toast_Words["load-project-success-message"], lang));
    });
  }

  return (
    <Render id={id} {...props}>
      <Flex w="100%" h="100%" direction="column">
        <CFHeading>{translate(Projects_Words["project-header"], lang)}</CFHeading>
        <CFDivider />
        <CFText ml="6px">{translate(Projects_Words["current-project-name"], lang)}</CFText>
        <CFInput
          mt="12px"
          value={userInputName}
          onChange={(e) => setUserInputName(e.target.value)}
        />
        <CFButton mt="12px" onClick={onRenameProject}>
          {translate(Projects_Words["save-project"], lang)}
        </CFButton>
        <CFDivider />
        {allProjects ? (
          allProjectUids.length > 0 ? (
            <CFSelect
              value={allProjects[selectedUid]}
              options={allProjectUids}
              onOptionClick={(uid) => setSelectedUid(uid)}
              optionConverter={(uid) => allProjects[uid]}
              menuListProps={{
                maxH: "116px",
                overflowY: "scroll",
              }}
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
      </Flex>
    </Render>
  );
};

const _ = observer(ProjectPlugin);
drawboardPluginFactory.register("project")(_);
export default _;
