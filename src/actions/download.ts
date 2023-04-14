import type { useToast } from "@chakra-ui/react";

import { Lang, download, toJsonBlob } from "@noli/core";
import { translate } from "@noli/business";

import { toast } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { useCurrentFullProject } from "./manageProjects";

export function downloadCurrentFullProject(t: ReturnType<typeof useToast>, lang: Lang): void {
  const fullProject = useCurrentFullProject();
  toast(t, "info", translate(Toast_Words["downloading-project-message"], lang));
  const blob = toJsonBlob(fullProject);
  download(blob, `${fullProject.name}.noli`);
}
