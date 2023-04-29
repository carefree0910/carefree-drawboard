import {
  INodePack,
  Matrix2D,
  Matrix2DFields,
  identityMatrix2DFields,
  safeCall,
} from "@carefree0910/core";
import {
  BoardStore,
  safeClearExecuterStack,
  useGlobalTransform,
  useSafeExecute,
} from "@carefree0910/business";

import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";
import { userStore } from "@/stores/user";
import {
  IProjectsStore,
  getNewProjectInfo,
  updateCurrentProjectInfo,
  updateCurrentProjectUpdateTime,
  useCurrentProjectInfo,
} from "@/stores/projects";

export interface IProject extends IProjectsStore {
  graphInfo: INodePack[];
  globalTransform: Matrix2DFields;
}
interface IProjectWithUserId extends IProject {
  userId: string;
}

export function getNewProject(): IProject {
  return { graphInfo: [], globalTransform: identityMatrix2DFields, ...getNewProjectInfo() };
}

export function useCurrentProjectWithUserId(): IProjectWithUserId {
  const info = useCurrentProjectInfo();
  const userId = userStore.userId;
  const graphInfo = BoardStore.graph.toJsonInfo();
  const globalTransform = useGlobalTransform().globalTransform.fields;
  return { ...info, userId, graphInfo, globalTransform };
}

export async function saveProject(
  projectWithUserId: IProjectWithUserId,
  onSuccess: () => Promise<void>,
  noToast?: boolean,
): Promise<void> {
  if (!noToast) {
    toastWord("info", Toast_Words["uploading-project-message"]);
  }

  return safeCall(
    async () => {
      const res = await Requests.postJson<{
        success: boolean;
        message: string;
      }>("_python", "/save_project", projectWithUserId);
      if (!res.success) {
        toastWord("warning", Toast_Words["save-project-error-message"], {
          appendix: ` - ${res.message}`,
        });
        throw Error;
      }
    },
    {
      success: onSuccess,
      failed: async () => void 0,
    },
  );
}
export async function saveCurrentProject(
  onSuccess: () => Promise<void>,
  noToast?: boolean,
): Promise<void> {
  updateCurrentProjectUpdateTime();
  const projectWithUserId = useCurrentProjectWithUserId();
  return saveProject(projectWithUserId, onSuccess, noToast);
}

function replaceCurrentProjectWith(
  project: IProject,
  onSuccess: (project: IProject) => Promise<void>,
): void {
  useSafeExecute("replaceGraph", null, false, {
    success: async () => {
      BoardStore.api.setGlobalTransform(new Matrix2D(project.globalTransform));
      safeClearExecuterStack();
      updateCurrentProjectInfo(project);
      onSuccess(project);
    },
    failed: async () => void 0,
  })({ json: JSON.stringify(project.graphInfo), apiInfos: {}, noFit: true });
}
export async function getProject(uid: string): Promise<IProject> {
  return Requests.get<IProject>("_python", `/get_project/?userId=${userStore.userId}&uid=${uid}`);
}
export async function loadProject(
  uid: string,
  onSuccess: (project: IProject) => Promise<void>,
): Promise<void> {
  toastWord("info", Toast_Words["loading-project-message"]);

  return safeCall(
    async () => getProject(uid).then((res) => replaceCurrentProjectWith(res, onSuccess)),
    {
      success: async () => void 0,
      failed: async () => void 0,
    },
  );
}
export function loadLocalProject(
  project: IProject,
  onSuccess: (project: IProject) => Promise<void>,
  noToast?: boolean,
): void {
  if (!noToast) {
    toastWord("info", Toast_Words["loading-project-message"]);
  }
  replaceCurrentProjectWith(project, onSuccess);
}

interface IProjectItem {
  uid: string;
  name: string;
}
export async function fetchAllProjectItems(): Promise<IProjectItem[] | undefined> {
  return safeCall(
    async () =>
      Requests.get<IProjectItem[]>("_python", `/all_projects/?userId=${userStore.userId}`),
    {
      success: async () => void 0,
      failed: async () => void 0,
    },
  );
}

export const AUTO_SAVE_PREFIX = "auto-save-";
export function getAutoSaveProject(): Promise<IProject> {
  const userId = userStore.userId;
  if (!userId) {
    throw Error("`userId` should be ready before calling `getAutoSaveProject`");
  }
  return fetchAllProjectItems().then((projects) => {
    const existingItem = (projects ?? []).find(({ uid }) => uid.startsWith(AUTO_SAVE_PREFIX));
    if (existingItem) return getProject(existingItem.uid);
    const autoSaveProject = { userId, ...getNewProject() };
    autoSaveProject.uid = `${AUTO_SAVE_PREFIX}${autoSaveProject.uid}`;
    autoSaveProject.name = "Auto Save";
    return saveProject(autoSaveProject, async () => void 0, true).then(() => autoSaveProject);
  });
}
