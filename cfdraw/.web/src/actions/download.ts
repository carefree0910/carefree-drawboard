import { download, toJsonBlob } from "@carefree0910/core";

import { toastWord } from "@/utils/toast";
import { Toast_Words } from "@/lang/toast";
import { useCurrentProjectWithUserId } from "./manageProjects";

export function downloadCurrentFullProject(): void {
  const projectWithUserId = useCurrentProjectWithUserId();
  toastWord("info", Toast_Words["downloading-project-message"]);
  const blob = toJsonBlob(projectWithUserId);
  download(blob, `${projectWithUserId.name}.cfdraw`);
}
