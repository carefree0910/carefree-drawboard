import { INodePack, Lang, Matrix2D, Matrix2DFields, safeCall } from "@carefree0910/core";
import {
  BoardStore,
  safeClearExecuterStack,
  translate,
  useGlobalTransform,
  useSafeExecute,
} from "@carefree0910/business";

import type { IToast } from "@/schema/misc";
import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";
import {
  IProjectsStore,
  updateCurrentProject,
  updateCurrentProjectUpdateTime,
  useCurrentProject,
} from "@/stores/projects";

interface IFullProject extends IProjectsStore {
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
  t: IToast,
  lang: Lang,
  onSuccess: () => Promise<void>,
  noToast?: boolean,
): Promise<void> {
  updateCurrentProjectUpdateTime();
  const fullProject = useCurrentFullProject();
  if (!noToast) {
    toast(t, "info", translate(Toast_Words["uploading-project-message"], lang));
  }

  return safeCall(
    async () => {
      const res = await Requests.postJson<{
        success: boolean;
        message: string;
      }>("_python", "/save_project", fullProject);
      if (!res.success) {
        toast(
          t,
          "warning",
          `${translate(Toast_Words["save-project-error-message"], lang)} - ${res.message}`,
        );
        throw Error;
      }
    },
    {
      success: onSuccess,
      failed: async () => void 0,
    },
  );
}

export interface ILoadedProject extends IProjectsStore {
  graphInfo: INodePack[];
  globalTransform: Matrix2DFields;
}
function replaceProjectWith(
  res: ILoadedProject,
  onSuccess: (res: ILoadedProject) => Promise<void>,
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
  t: IToast,
  lang: Lang,
  uid: string,
  onSuccess: (res: ILoadedProject) => Promise<void>,
): Promise<void> {
  toast(t, "info", translate(Toast_Words["loading-project-message"], lang));

  return safeCall(
    async () =>
      Requests.get<ILoadedProject>("_python", `/get_project/${uid}`).then((res) =>
        replaceProjectWith(res, onSuccess),
      ),
    {
      success: async () => void 0,
      failed: async () => void 0,
    },
  );
}
export function loadLocalProject(
  t: IToast,
  lang: Lang,
  res: ILoadedProject,
  onSuccess: (res: ILoadedProject) => Promise<void>,
  noToast?: boolean,
): void {
  if (!noToast) {
    toast(t, "info", translate(Toast_Words["loading-project-message"], lang));
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
