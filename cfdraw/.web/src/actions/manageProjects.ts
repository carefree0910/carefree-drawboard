import { INodePack, Matrix2D, Matrix2DFields, safeCall } from "@carefree0910/core";
import {
  BoardStore,
  safeClearExecuterStack,
  useGlobalTransform,
  useSafeExecute,
} from "@carefree0910/business";

import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";
import {
  IProjectsStore,
  updateCurrentProject,
  updateCurrentProjectUpdateTime,
  useCurrentProject,
} from "@/stores/projects";

export interface IFullProject extends IProjectsStore {
  graphInfo: INodePack[];
  globalTransform: Matrix2DFields;
}

export function useCurrentFullProject(): IFullProject {
  const data = useCurrentProject();
  const graphInfo = BoardStore.graph.toJsonInfo();
  const globalTransform = useGlobalTransform().globalTransform.fields;
  return { ...data, graphInfo, globalTransform };
}

export async function saveProject(
  onSuccess: () => Promise<void>,
  noToast?: boolean,
): Promise<void> {
  updateCurrentProjectUpdateTime();
  const fullProject = useCurrentFullProject();
  if (!noToast) {
    toastWord("info", Toast_Words["uploading-project-message"]);
  }

  return safeCall(
    async () => {
      const res = await Requests.postJson<{
        success: boolean;
        message: string;
      }>("_python", "/save_project", fullProject);
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

function replaceProjectWith(
  res: IFullProject,
  onSuccess: (res: IFullProject) => Promise<void>,
): void {
  useSafeExecute("replaceGraph", null, false, {
    success: async () => {
      BoardStore.api.setGlobalTransform(new Matrix2D(res.globalTransform));
      safeClearExecuterStack();
      updateCurrentProject(res);
      onSuccess(res);
    },
    failed: async () => void 0,
  })({ json: JSON.stringify(res.graphInfo), apiInfos: {}, noFit: true });
}
export async function loadProject(
  uid: string,
  onSuccess: (res: IFullProject) => Promise<void>,
): Promise<void> {
  toastWord("info", Toast_Words["loading-project-message"]);

  return safeCall(
    async () =>
      Requests.get<IFullProject>("_python", `/get_project/${uid}`).then((res) =>
        replaceProjectWith(res, onSuccess),
      ),
    {
      success: async () => void 0,
      failed: async () => void 0,
    },
  );
}
export function loadLocalProject(
  res: IFullProject,
  onSuccess: (res: IFullProject) => Promise<void>,
  noToast?: boolean,
): void {
  if (!noToast) {
    toastWord("info", Toast_Words["loading-project-message"]);
  }
  replaceProjectWith(res, onSuccess);
}

interface IProjectItem {
  uid: string;
  name: string;
}
export async function fetchAllProjects(): Promise<IProjectItem[] | undefined> {
  return safeCall(async () => Requests.get<IProjectItem[]>("_python", "/all_projects"), {
    success: async () => void 0,
    failed: async () => void 0,
  });
}
