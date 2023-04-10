import { useToast } from "@chakra-ui/toast";

import { Lang, safeCall } from "@noli/core";
import { BoardStore, translate, useGlobalTransform } from "@noli/business";

import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { Requests } from "@/requests/actions";
import { useCurrentProject } from "@/stores/projects";

export async function saveProject(
  t: ReturnType<typeof useToast>,
  lang: Lang,
  onSuccess: () => Promise<void>,
): Promise<void> {
  const data = useCurrentProject();
  const graphInfo = BoardStore.graph.toJsonInfo();
  const globalTransform = useGlobalTransform().globalTransform.fields;
  toast(t, "info", translate(Toast_Words["uploading-project-message"], lang));

  return safeCall(
    async () => {
      const res = await Requests.postJson<{
        success: boolean;
        message: string;
      }>("_python", "/save_project", { graphInfo, globalTransform, ...data });
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
